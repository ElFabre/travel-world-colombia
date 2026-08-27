import { createAdminClient } from '@/lib/supabase/admin'

/** Acciones registrables en la bitácora del panel. */
export type AccionAudit =
  | 'crear'
  | 'actualizar'
  | 'eliminar'
  | 'activar'
  | 'ocultar'
  | 'destacar'
  | 'quitar-destacado'
  | 'aprobar-usuario'
  | 'revocar-usuario'
  | 'cambiar-rol'
  | 'guardar-reserva'

interface RegistroActividad {
  email: string
  accion: AccionAudit
  slug?: string
  nombre?: string
  detalle?: Record<string, unknown>
}

/**
 * Inserta una entrada en `audit_log` con el correo del usuario que hizo el
 * cambio. Usa el cliente service-role (omite RLS). Nunca lanza: un fallo al
 * registrar la actividad no debe tumbar la mutación que la originó.
 */
export async function registrarActividad({
  email,
  accion,
  slug,
  nombre,
  detalle,
}: RegistroActividad): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_log').insert({
      user_email: email,
      accion,
      destino_slug: slug ?? null,
      destino_nombre: nombre ?? null,
      detalle: detalle ?? null,
    })
    if (error) console.error('[audit] no se pudo registrar la actividad:', error.message)
  } catch (e) {
    console.error('[audit] error inesperado registrando actividad:', e)
  }
}
