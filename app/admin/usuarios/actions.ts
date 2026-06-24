'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/guard'
import { isSuperadmin } from '@/lib/admin/allowlist'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarActividad } from '@/lib/admin/audit'

/** Aprueba un correo: lo agrega a la allowlist (acceso inmediato, sin redeploy). */
export async function aprobarUsuario(email: string): Promise<void> {
  const user = await requireAdmin()
  const e = email.trim().toLowerCase()
  if (!e) throw new Error('Correo vacío.')

  const admin = createAdminClient()
  const { error } = await admin
    .from('admin_allowlist')
    .upsert({ email: e, aprobado_por: user.email }, { onConflict: 'email' })
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: 'aprobar-usuario', nombre: e })
  revalidatePath('/admin/usuarios')
}

/** Revoca el acceso de un correo (lo quita de la allowlist). */
export async function revocarUsuario(email: string): Promise<void> {
  const user = await requireAdmin()
  const e = email.trim().toLowerCase()
  if (isSuperadmin(e)) throw new Error('No puedes revocar a un superadmin (definido en ADMIN_EMAILS).')

  const admin = createAdminClient()
  const { error } = await admin.from('admin_allowlist').delete().eq('email', e)
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: 'revocar-usuario', nombre: e })
  revalidatePath('/admin/usuarios')
}
