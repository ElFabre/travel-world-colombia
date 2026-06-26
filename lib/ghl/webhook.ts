import type { Lead } from '@/types/lead'

export async function enviarLeadAGHL(lead: Lead): Promise<boolean> {
  const url = process.env.GHL_WEBHOOK_URL
  if (!url) {
    console.error('[ghl] Falta GHL_WEBHOOK_URL — no se envió el lead.')
    return false
  }

  const payload = {
    firstName: lead.nombre,
    email: lead.email,
    phone: lead.telefono,
    tags: ['web-form', lead.origen ?? 'formulario-web', lead.destino_interes ?? 'general'],
    source: 'Travel World Colombia — Sitio Web',
    customField: {
      destino_interes:  lead.destino_interes,
      num_personas:     lead.num_personas,
      fecha_viaje:      lead.fecha_viaje,
      presupuesto:      lead.presupuesto,
      mensaje:          lead.mensaje,
      origen_popup:     lead.origen,
      utm_source:       lead.utm_source,
      utm_medium:       lead.utm_medium,
      utm_campaign:     lead.utm_campaign,
    },
  }

  try {
    // Timeout de 8s: GHL es el único destino del lead; si su endpoint se cuelga
    // no debe bloquear la server action indefinidamente.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) console.error('[ghl] respuesta no OK:', res.status)
    return res.ok
  } catch (e) {
    console.error('[ghl] envío falló:', e)
    return false
  }
}
