import type { Lead } from '@/types/lead'

export async function enviarLeadAGHL(lead: Lead): Promise<boolean> {
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

  const res = await fetch(process.env.GHL_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return res.ok
}
