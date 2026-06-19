import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/** Lista de emails admin desde env (separados por coma). */
function adminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) ?? []
}

/**
 * Devuelve el usuario admin autenticado, o null si no hay sesión o no es admin.
 * Revalida el JWT contra Supabase (getUser) — defensa en profundidad además
 * del gate del proxy, porque las server actions pueden invocarse directamente.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (!adminEmails().includes((user.email ?? '').toLowerCase())) return null
  return user
}

/** Igual que getAdminUser pero lanza si no es admin (para usar en mutaciones). */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser()
  if (!user) throw new Error('No autorizado')
  return user
}
