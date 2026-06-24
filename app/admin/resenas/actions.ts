'use server'

import { revalidatePath } from 'next/cache'
import { requireEditor, requireAdminRole } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarActividad } from '@/lib/admin/audit'

export type ResenaState = { error?: string; ok?: boolean }

function revalidar() {
  revalidatePath('/admin/resenas')
  revalidatePath('/admin')
  revalidatePath('/') // testimonios en la web pública
}

/** Crea una reseña/testimonio. */
export async function crearResena(_prev: ResenaState, formData: FormData): Promise<ResenaState> {
  const { user } = await requireEditor()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const texto = String(formData.get('texto') ?? '').trim()
  if (!nombre || !texto) return { error: 'Nombre y texto son obligatorios.' }

  const estrellas = Math.min(5, Math.max(1, Number(formData.get('estrellas') ?? 5) || 5))
  const destino = String(formData.get('destino') ?? '').trim() || null
  const fuente = String(formData.get('fuente') ?? 'manual').trim() || 'manual'

  const admin = createAdminClient()
  const { error } = await admin.from('resenas').insert({ nombre, texto, estrellas, destino, fuente, activa: true })
  if (error) return { error: error.message }

  await registrarActividad({ email: user.email!, accion: 'crear', nombre: `Reseña de ${nombre}` })
  revalidar()
  return { ok: true }
}

/** Activa/oculta una reseña. */
export async function toggleResenaActiva(id: string, valor: boolean, nombre: string): Promise<void> {
  const { user } = await requireEditor()
  const admin = createAdminClient()
  const { error } = await admin.from('resenas').update({ activa: valor }).eq('id', id)
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: valor ? 'activar' : 'ocultar', nombre: `Reseña de ${nombre}` })
  revalidar()
}

/** Elimina una reseña. */
export async function eliminarResena(id: string, nombre: string): Promise<void> {
  const { user } = await requireAdminRole()
  const admin = createAdminClient()
  const { error } = await admin.from('resenas').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: 'eliminar', nombre: `Reseña de ${nombre}` })
  revalidar()
}
