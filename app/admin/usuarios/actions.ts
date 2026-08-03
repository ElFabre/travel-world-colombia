'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminRole } from '@/lib/admin/guard'
import { isSuperadmin, type Role, ROLES } from '@/lib/admin/allowlist'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarActividad } from '@/lib/admin/audit'

/** Aprueba un correo manualmente (rol editor por defecto). Solo admin. */
export async function aprobarUsuario(email: string): Promise<void> {
  const { user } = await requireAdminRole()
  const e = email.trim().toLowerCase()
  if (!e) throw new Error('Correo vacío.')

  const admin = createAdminClient()
  const { error } = await admin
    .from('admin_allowlist')
    .upsert({ email: e, rol: 'editor', aprobado_por: user.email }, { onConflict: 'email' })
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: 'aprobar-usuario', nombre: e })
  revalidatePath('/admin/usuarios')
}

/** Cambia el rol de un usuario. Solo admin: gestionar accesos no es de editores. */
export async function cambiarRol(email: string, rol: Role): Promise<void> {
  const { user } = await requireAdminRole()
  const e = email.trim().toLowerCase()
  if (!ROLES.includes(rol)) throw new Error('Rol inválido.')
  if (isSuperadmin(e)) throw new Error('No puedes cambiar el rol de un superadmin.')
  if (e === (user.email ?? '').toLowerCase()) throw new Error('No puedes cambiar tu propio rol.')

  const admin = createAdminClient()
  const { error } = await admin.from('admin_allowlist').update({ rol }).eq('email', e)
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: 'cambiar-rol', nombre: `${e} → ${rol}` })
  revalidatePath('/admin/usuarios')
}

/** Revoca el acceso de un correo (solo admin; es una eliminación). */
export async function revocarUsuario(email: string): Promise<void> {
  const { user } = await requireAdminRole()
  const e = email.trim().toLowerCase()
  if (isSuperadmin(e)) throw new Error('No puedes revocar a un superadmin (definido en ADMIN_EMAILS).')

  const admin = createAdminClient()
  const { error } = await admin.from('admin_allowlist').delete().eq('email', e)
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: 'revocar-usuario', nombre: e })
  revalidatePath('/admin/usuarios')
}
