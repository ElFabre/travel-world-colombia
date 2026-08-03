import { createAdminClient } from '@/lib/supabase/admin'
import type { Autor } from '@/lib/agente/autor'

interface RegistroEvento {
  tipo?: string
  conversationId?: string
  contactId?: string
  messageId?: string
  direccion?: string
  autor: Autor
  canal?: string
  cuerpo?: string
  payload: unknown
  nota?: string
}

/** El cuerpo se recorta: la bitácora es para leer a ojo, el crudo va en `payload`. */
const MAX_CUERPO = 2000

/**
 * Guarda un evento del webhook. Nunca lanza: un fallo registrando no puede
 * tumbar la respuesta al webhook (GHL reintentaría y duplicaría el evento).
 */
export async function registrarEvento(e: RegistroEvento): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('agente_eventos').insert({
      tipo: e.tipo ?? null,
      conversation_id: e.conversationId ?? null,
      contact_id: e.contactId ?? null,
      message_id: e.messageId ?? null,
      direccion: e.direccion ?? null,
      autor: e.autor,
      canal: e.canal ?? null,
      cuerpo: e.cuerpo ? e.cuerpo.slice(0, MAX_CUERPO) : null,
      payload: e.payload as never,
      nota: e.nota ?? null,
    })
    if (error) console.error('registrarEvento error:', error.message)
  } catch (err) {
    console.error('registrarEvento excepción:', (err as Error).message)
  }
}
