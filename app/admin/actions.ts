'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireEditor, requireAdminRole } from '@/lib/admin/guard'
import { isApprovedEmail } from '@/lib/admin/allowlist'
import { registrarActividad } from '@/lib/admin/audit'
import { SITE } from '@/lib/site'

export type LoginState = { error?: string }
export type RegisterState = { error?: string; ok?: string }
export type ResetState = { error?: string; ok?: string }

/** Inicio de sesión del admin. */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresa email y contraseña.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Distinguimos "correo sin confirmar" de credenciales realmente erróneas:
    // antes ambos casos se mostraban como "Credenciales inválidas".
    if (/not confirmed|no confirmado/i.test(error.message)) {
      return { error: 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada y haz clic en el enlace que te enviamos.' }
    }
    return { error: 'Credenciales inválidas.' }
  }

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
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    const msg = /already registered|already exists/i.test(error.message)
      ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
      : error.message
    return { error: msg }
  }

  // Con la confirmación de correo activada, registrar un correo ya existente
  // devuelve "ok" pero sin identidades nuevas (Supabase evita filtrar quién
  // tiene cuenta). Lo tratamos como cuenta existente.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'Ya existe una cuenta con ese correo. Inicia sesión.' }
  }

  // Ruta B: NO auto-confirmamos. Supabase envía su correo de confirmación
  // nativo y el usuario debe hacer clic en el enlace (lo procesa /auth/confirm)
  // antes de poder iniciar sesión.

  // NO se pre-aprueba: la cuenta queda sin fila en `admin_allowlist` hasta que
  // un admin la apruebe desde /admin/usuarios. (Antes se insertaba aquí como
  // 'editor' automáticamente, lo que daba acceso al panel a cualquiera que se
  // registrara — corregido en la auditoría del 2026-08-03.)

  return {
    ok: 'Cuenta creada. Te enviamos un correo de confirmación. Cuando la actives, un administrador debe aprobar tu acceso antes de que puedas entrar al panel.',
  }
}

/**
 * "Olvidé mi contraseña": envía el correo de restablecimiento nativo de Supabase.
 *
 * El enlace del correo pasa por `/auth/confirm` (que crea la sesión de
 * recuperación con verifyOtp) y de ahí a `/admin/actualizar-password`. Requiere
 * que la plantilla "Reset Password" del dashboard de Supabase apunte a:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/actualizar-password
 *
 * Respuesta SIEMPRE genérica: no revela si el correo está registrado (evita
 * enumeración de cuentas).
 */
export async function solicitarReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Ingresa tu correo.' }

  const supabase = await createClient()
  const redirectTo = `${SITE.url}/auth/confirm?next=/admin/actualizar-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error && /rate|too many|seconds|429/i.test(error.message)) {
    return { error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' }
  }
  // Cualquier otro caso (incl. correo inexistente) → mismo mensaje.
  return {
    ok: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam).',
  }
}

/**
 * Guarda la nueva contraseña. Corre sobre la sesión de recuperación que dejó
 * `/auth/confirm` al verificar el enlace del correo.
 */
export async function actualizarPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'El enlace expiró o no es válido. Vuelve a solicitar el restablecimiento desde el login.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (/different from the old|should be different/i.test(error.message)) {
      return { error: 'La nueva contraseña debe ser distinta a la anterior.' }
    }
    return { error: 'No se pudo actualizar la contraseña. Inténtalo de nuevo.' }
  }
  return { ok: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' }
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
  const { user } = await requireEditor()
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

  // Sin el slug, el detalle /destinos/[slug] conserva hasta 30 min el 404 (o la
  // página vieja) cacheado por ISR aunque el destino ya esté activo/oculto.
  revalidarDestinos(destino?.slug)
  revalidatePath('/admin')
  revalidatePath('/admin/viajes')
}

/** Elimina un destino. */
export async function eliminarDestino(id: string): Promise<void> {
  const { user } = await requireAdminRole()
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

  // El slug purga la página del destino borrado; si no, sigue viva en caché.
  revalidarDestinos(destino?.slug)
  revalidatePath('/admin')
  revalidatePath('/admin/viajes')
}
