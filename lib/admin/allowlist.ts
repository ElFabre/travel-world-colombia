import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Gestión de la allowlist del panel. Dos fuentes:
 *  - Superadmins fijos en la env `ADMIN_EMAILS` (arranque; nunca se bloquean).
 *  - Tabla `admin_allowlist`, editable desde /admin/usuarios (Aprobar/Revocar).
 */

/** Superadmins definidos en env (en minúsculas). */
export function superadmins(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) ?? []
}

/** ¿Es superadmin de arranque (env)? No se puede revocar desde el panel. */
export function isSuperadmin(email: string | null | undefined): boolean {
  return superadmins().includes((email ?? '').toLowerCase())
}

/**
 * ¿Tiene este correo acceso al panel? Superadmin (env) o aprobado en la tabla.
 * Usa service-role (omite RLS) para que el chequeo funcione en cualquier contexto.
 */
export async function isApprovedEmail(email: string | null | undefined): Promise<boolean> {
  const e = (email ?? '').toLowerCase()
  if (!e) return false
  if (superadmins().includes(e)) return true
  const admin = createAdminClient()
  const { data } = await admin.from('admin_allowlist').select('email').eq('email', e).maybeSingle()
  return Boolean(data)
}
