'use server'

import { revalidatePath } from 'next/cache'
import { requireEditor, requireAdminRole } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarActividad } from '@/lib/admin/audit'

export type FaqState = { error?: string; ok?: boolean }

function revalidar() {
  revalidatePath('/admin/faqs')
  revalidatePath('/admin')
  revalidatePath('/nosotros') // acordeón + JSON-LD en la web pública
}

/** Crea una pregunta frecuente. Se agrega al final (mayor `orden` + 1). */
export async function crearFaq(_prev: FaqState, formData: FormData): Promise<FaqState> {
  const { user } = await requireEditor()
  const pregunta = String(formData.get('pregunta') ?? '').trim()
  const respuesta = String(formData.get('respuesta') ?? '').trim()
  if (!pregunta || !respuesta) return { error: 'Pregunta y respuesta son obligatorias.' }

  const admin = createAdminClient()
  // Calcula el siguiente orden para que la nueva FAQ quede al final.
  const { data: ultima } = await admin
    .from('faqs')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()
  const orden = (ultima?.orden ?? 0) + 1

  const { error } = await admin.from('faqs').insert({ pregunta, respuesta, orden, activa: true })
  if (error) return { error: error.message }

  await registrarActividad({ email: user.email!, accion: 'crear', nombre: `FAQ: ${pregunta}` })
  revalidar()
  return { ok: true }
}

/** Activa/oculta una pregunta frecuente. */
export async function toggleFaqActiva(id: string, valor: boolean, pregunta: string): Promise<void> {
  const { user } = await requireEditor()
  const admin = createAdminClient()
  const { error } = await admin.from('faqs').update({ activa: valor }).eq('id', id)
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: valor ? 'activar' : 'ocultar', nombre: `FAQ: ${pregunta}` })
  revalidar()
}

/** Elimina una pregunta frecuente. */
export async function eliminarFaq(id: string, pregunta: string): Promise<void> {
  const { user } = await requireAdminRole()
  const admin = createAdminClient()
  const { error } = await admin.from('faqs').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await registrarActividad({ email: user.email!, accion: 'eliminar', nombre: `FAQ: ${pregunta}` })
  revalidar()
}
