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
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + options.windowMs })
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
let upstash: Ratelimit | null | undefined

function getUpstash(limit: number, windowMs: number): Ratelimit | null {
  if (upstash !== undefined) return upstash
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  upstash = url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
        prefix: 'twc/rl',
        analytics: false,
      })
    : null
  return upstash
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
