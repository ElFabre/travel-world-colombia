import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitOptions {
  limit: number
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfter: number
}

// ── Fallback en memoria ──
// Válido para un solo proceso. En serverless con múltiples instancias no es
// 100% fiable; por eso, si hay credenciales de Upstash, se usa Redis.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimitMemoria(ip: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  // La config forma parte de la clave: dos límites distintos sobre el mismo
  // identificador no deben compartir contador.
  const clave = `${ip}|${options.limit}/${options.windowMs}`
  const record = rateLimitMap.get(clave)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clave, { count: 1, resetTime: now + options.windowMs })
    return { success: true, remaining: options.limit - 1, retryAfter: 0 }
  }

  if (record.count >= options.limit) {
    return { success: false, remaining: 0, retryAfter: Math.ceil((record.resetTime - now) / 1000) }
  }

  record.count++
  return { success: true, remaining: options.limit - record.count, retryAfter: 0 }
}

// ── Upstash Redis (distribuido) ──
// Se activa solo si existen las credenciales (UPSTASH_* o KV_*), que Vercel
// inyecta al instalar la integración de Upstash desde el Marketplace.
// Un limitador por configuración (limit/window): antes había uno solo y la
// primera llamada fijaba su ventana para todos los demás usos del proceso.
// La config va también en el prefijo para que dos límites distintos sobre el
// mismo identificador no compartan contador.
let redis: Redis | null | undefined
const limitadores = new Map<string, Ratelimit>()

function getUpstash(limit: number, windowMs: number): Ratelimit | null {
  if (redis === undefined) {
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
    redis = url && token ? new Redis({ url, token }) : null
  }
  if (!redis) return null

  const segundos = Math.round(windowMs / 1000)
  const clave = `${limit}/${segundos}`
  let limitador = limitadores.get(clave)
  if (!limitador) {
    limitador = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${segundos} s`),
      prefix: `twc/rl/${clave}`,
      analytics: false,
    })
    limitadores.set(clave, limitador)
  }
  return limitador
}

/**
 * Rate limit por identificador (normalmente la IP). Usa Upstash Redis si está
 * configurado (fiable en serverless); si no, cae al contador en memoria.
 */
export async function checkRateLimit(
  ip: string,
  options: RateLimitOptions = { limit: 5, windowMs: 60_000 }
): Promise<RateLimitResult> {
  const limiter = getUpstash(options.limit, options.windowMs)
  if (limiter) {
    const { success, remaining, reset } = await limiter.limit(ip)
    return {
      success,
      remaining,
      retryAfter: success ? 0 : Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
    }
  }
  return rateLimitMemoria(ip, options)
}
