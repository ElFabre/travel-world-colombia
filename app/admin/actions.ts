'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/guard'
import { isSuperadmin, isApprovedEmail } from '@/lib/admin/allowlist'
import { registrarActividad } from '@/lib/admin/audit'

export type LoginState = { error?: string }
export type RegisterState = { error?: string; ok?: string }

/** Inicio de sesión del admin. */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresa email y contraseña.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Credenciales inválidas.' }

  // Aprobado (env o allowlist) → su panel/backend. Pendiente → pantalla de
  // "pendiente de aprobación". (El proxy refuerza el mismo gate.)
  if (await isApprovedEmail(email)) redirect('/admin')
  redirect('/admin/registro')
}

/**
 * Auto-registro de personal. Cualquiera puede crear una cuenta, pero el acceso
 * al panel queda gated por la allowlist `ADMIN_EMAILS`: hasta que el dueño
 * agrega el correo, la cuenta queda "pendiente de aprobación".
 */
export async function signUp(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!email || !password) return { error: 'Ingresa email y contraseña.' }
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    const msg = /already registered|already exists/i.test(error.message)
      ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
      : error.message
    return { error: msg }
  }

  // El acceso real lo decide la allowlist, no el registro.
  return {
    ok: isSuperadmin(email)
      ? 'Cuenta creada. Si Supabase pide confirmar tu correo, revisa tu bandeja; luego inicia sesión.'
      : 'Cuenta creada. Tu acceso queda pendiente de aprobación del administrador.',
  }
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
  const user = await requireAdmin()
  const supabase = await createClient()
  // Leemos nombre/slug antes de mutar para enriquecer la bitácora.
  const { data: destino } = await supabase
    .from('destinos')
    .select('slug, nombre')
    .eq('id', id)
    .single()
  const { error } = await supabase.from('destinos').update({ [campo]: valor }).eq('id', id)
  if (error) throw new Error(error.message)

  const accion =
    campo === 'activo'
      ? valor ? 'activar' : 'ocultar'
      : valor ? 'destacar' : 'quitar-destacado'
  await registrarActividad({
    email: user.email!,
    accion,
    slug: destino?.slug,
    nombre: destino?.nombre,
  })

  revalidarDestinos()
  revalidatePath('/admin')
  revalidatePath('/admin/viajes')
}

/** Elimina un destino. */
export async function eliminarDestino(id: string): Promise<void> {
  const user = await requireAdmin()
  const supabase = await createClient()
  // Leemos nombre/slug antes de borrar: después ya no existen.
  const { data: destino } = await supabase
    .from('destinos')
    .select('slug, nombre')
    .eq('id', id)
    .single()
  const { error } = await supabase.from('destinos').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await registrarActividad({
    email: user.email!,
    accion: 'eliminar',
    slug: destino?.slug,
    nombre: destino?.nombre,
  })

  revalidarDestinos()
  revalidatePath('/admin')
  revalidatePath('/admin/viajes')
}
