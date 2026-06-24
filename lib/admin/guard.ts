import { createClient } from '@/lib/supabase/server'
import { isApprovedEmail } from '@/lib/admin/allowlist'
import type { User } from '@supabase/supabase-js'

/**
 * Devuelve el usuario admin autenticado, o null si no hay sesión o no está
 * aprobado. Revalida el JWT contra Supabase (getUser) y consulta la allowlist
 * (env `ADMIN_EMAILS` o tabla `admin_allowlist`) — defensa en profundidad
 * además del gate del proxy, porque las server actions pueden invocarse directo.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (!(await isApprovedEmail(user.email))) return null
  return user
}

/** Igual que getAdminUser pero lanza si no es admin (para usar en mutaciones). */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser()
  if (!user) throw new Error('No autorizado')
  return user
}
