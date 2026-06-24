import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  // ── 1. Protección del panel admin (chequeo optimista) ──
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // getUser() revalida el JWT contra el servidor de Supabase
    // (más seguro que getSession(), que solo confía en la cookie).
    const { data: { user } } = await supabase.auth.getUser()

    // Páginas de auth públicas: login (entrar) y registro (crear cuenta / ver
    // estado "pendiente de aprobación"). No deben forzar redirecciones.
    const path = req.nextUrl.pathname
    const isAuthPage = path.startsWith('/admin/login') || path.startsWith('/admin/registro')

    if (!user && !isAuthPage) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    if (user && !isAuthPage) {
      const email = (user.email ?? '').toLowerCase()
      const superadmins = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []
      let aprobado = superadmins.includes(email)
      if (!aprobado) {
        // ¿Aprobado desde el panel? (tabla admin_allowlist). El usuario está
        // autenticado, así que la política RLS de lectura lo permite.
        const { data } = await supabase.from('admin_allowlist').select('email').eq('email', email).maybeSingle()
        aprobado = Boolean(data)
      }
      if (!aprobado) {
        // Autenticado pero fuera de la allowlist → pantalla de "pendiente".
        return NextResponse.redirect(new URL('/admin/registro', req.url))
      }
    }
  }

  // ── 2. CORS para API routes ──
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin')
    const allowedOrigins = [
      'https://travelworldcolombia.com',
      'http://localhost:3000',
      'http://localhost:3100',
    ]
    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // ── 3. Headers de seguridad ──
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()')

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
