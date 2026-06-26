import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Solo protege el panel admin (chequeo optimista). Los headers de seguridad
 * viven en next.config.ts (fuente única); por eso el matcher se limita a
 * /admin y no corre en cada request del sitio público.
 */
export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

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
      // autenticado, así que la política RLS de lectura de su fila lo permite.
      const { data } = await supabase.from('admin_allowlist').select('email').eq('email', email).maybeSingle()
      aprobado = Boolean(data)
    }
    if (!aprobado) {
      // Autenticado pero fuera de la allowlist → pantalla de "pendiente".
      return NextResponse.redirect(new URL('/admin/registro', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}
