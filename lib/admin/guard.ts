import { createClient } from '@/lib/supabase/server'
import { getRole, type Role } from '@/lib/admin/allowlist'
import type { User } from '@supabase/supabase-js'

export interface AdminSession { user: User; rol: Role }

/**
 * Sesión admin: usuario autenticado + su rol, o null si no hay sesión o no
 * está aprobado. Revalida el JWT (getUser) y consulta la allowlist (env o
 * tabla). Defensa en profundidad además del gate del proxy.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const rol = await getRole(user.email)
  if (!rol) return null
  return { user, rol }
}

/** Solo el usuario (compat). null si no aprobado. */
export async function getAdminUser(): Promise<User | null> {
  return (await getAdminSession())?.user ?? null
}

/** Cualquier rol aprobado (para lectura). Lanza si no está autorizado. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) throw new Error('No autorizado')
  return session
}

/** admin o editor (puede modificar). Lanza si es lector o no aprobado. */
export async function requireEditor(): Promise<AdminSession> {
  const session = await requireAdmin()
  if (session.rol === 'lector') throw new Error('Tu rol (lector) no permite modificar.')
  return session
}

/** Solo admin (eliminar, revocar, otorgar admin). Lanza en cualquier otro caso. */
export async function requireAdminRole(): Promise<AdminSession> {
  const session = await requireAdmin()
  if (session.rol !== 'admin') throw new Error('Solo un administrador puede hacer esto.')
  return session
}
