export type LeadOrigen = 'formulario-web' | 'popup-exit' | 'popup-timed' | 'popup-scroll' | 'whatsapp'

export interface Lead {
  id?: string
  nombre: string
  email: string
  telefono: string
  destino_interes?: string
  num_personas?: number
  fecha_viaje?: string
  presupuesto?: string
  mensaje?: string
  origen?: LeadOrigen
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  ghl_enviado?: boolean
  ghl_contact_id?: string
  created_at?: string
}
