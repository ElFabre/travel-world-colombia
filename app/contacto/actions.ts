'use server'

import { cotizacionSchema } from '@/lib/validations/cotizacion'
import { enviarLeadAGHL } from '@/lib/ghl/webhook'

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string }

export async function submitCotizacion(raw: unknown): Promise<ActionResult> {
  const parsed = cotizacionSchema.safeParse(raw)

  if (!parsed.success) {
    return { ok: false, message: 'Revisa los campos del formulario.' }
  }

  // Honeypot
  if (parsed.data.website) {
    return { ok: true } // silencioso para bots
  }

  const d = parsed.data
  const telefono = `+57${d.whatsapp}`
  const fecha_viaje = `${d.fecha_mes} ${d.fecha_año}`

  // Pseudo-email requerido por GHL para crear contacto
  const email = `${d.whatsapp}@contacto.travelworldcolombia.com`

  try {
    const ok = await enviarLeadAGHL({
      nombre:           d.nombre,
      email,
      telefono,
      destino_interes:  d.destino_interes,
      num_personas:     d.num_viajeros,
      fecha_viaje,
      presupuesto:      d.presupuesto,
      mensaje:          d.mensaje?.trim() || undefined,
      origen:           'formulario-web',
    })

    if (!ok) return { ok: false, message: 'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.' }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Ocurrió un error inesperado. Escríbenos directamente por WhatsApp.' }
  }
}
