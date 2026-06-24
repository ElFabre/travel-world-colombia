import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Gestión de la allowlist del panel. Dos fuentes:
 *  - Superadmins fijos en la env `ADMIN_EMAILS` (arranque; nunca se bloquean).
 *  - Tabla `admin_allowlist`, editable desde /admin/usuarios.
 */

/** Roles del panel: admin (todo) · editor (todo menos eliminar) · lector (solo ver). */
export type Role = 'admin' | 'editor' | 'lector'

export const ROLES: Role[] = ['admin', 'editor', 'lector']

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  lector: 'Lector',
}

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
  return (await getRole(email)) !== null
}

/**
 * Devuelve el rol del correo, o null si no tiene acceso al panel.
 * Superadmins (env) siempre 'admin'. El resto, según la tabla `admin_allowlist`.
 */
export async function getRole(email: string | null | undefined): Promise<Role | null> {
  const e = (email ?? '').toLowerCase()
  if (!e) return null
  if (superadmins().includes(e)) return 'admin'
  const admin = createAdminClient()
  const { data } = await admin.from('admin_allowlist').select('rol').eq('email', e).maybeSingle()
  if (!data) return null
  return (data.rol as Role) ?? 'lector'
}
