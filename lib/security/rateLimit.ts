import { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  limit: number
  windowMs: number
}

export function rateLimit(req: NextRequest, options: RateLimitOptions = { limit: 5, windowMs: 60_000 }) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    req.headers.get('x-real-ip') ??
    'unknown'

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
