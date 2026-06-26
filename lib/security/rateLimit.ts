// NOTA: store en memoria — válido para un solo proceso. En serverless con
// múltiples instancias no es 100% fiable; para producción de alto tráfico,
// migrar a un store distribuido (Upstash Redis / Vercel KV).
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  limit: number
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfter: number
}

/** Rate limit por identificador (normalmente la IP). */
export function rateLimitByIp(
  ip: string,
  options: RateLimitOptions = { limit: 5, windowMs: 60_000 }
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + options.windowMs })
    return { success: true, remaining: options.limit - 1, retryAfter: 0 }
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  record.count++
  return { success: true, remaining: options.limit - record.count, retryAfter: 0 }
}
