'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/guard'

export type LoginState = { error?: string }

/** Inicio de sesión del admin. */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresa email y contraseña.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Credenciales inválidas.' }

  // El gate del proxy valida además que el email esté en ADMIN_EMAILS.
  redirect('/admin')
}

/** Cierre de sesión. */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

/** Revalida las rutas públicas que muestran destinos. */
function revalidarDestinos(slug?: string) {
  revalidatePath('/')
  revalidatePath('/destinos')
  if (slug) revalidatePath(`/destinos/${slug}`)
  revalidatePath('/sitemap.xml')
}

/** Alterna activo/destacado de un destino. */
export async function toggleCampo(
  id: string,
  campo: 'activo' | 'destacado',
  valor: boolean
): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('destinos').update({ [campo]: valor }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidarDestinos()
  revalidatePath('/admin')
}

/** Elimina un destino. */
export async function eliminarDestino(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('destinos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidarDestinos()
  revalidatePath('/admin')
}
