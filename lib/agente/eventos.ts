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
export async function registrarEvento(
  e: RegistroEvento
): Promise<{ id: string; recibidoEn: string } | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('agente_eventos')
      .insert({
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
      .select('id, recibido_en')
      .single()

    if (error) {
      console.error('registrarEvento error:', error.message)
      return null
    }
    return { id: data.id as string, recibidoEn: data.recibido_en as string }
  } catch (err) {
    console.error('registrarEvento excepción:', (err as Error).message)
    return null
  }
}

/** Agrega el resultado del turno a un evento ya registrado. */
export async function anotarEvento(id: string, extra: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('agente_eventos').select('nota').eq('id', id).maybeSingle()
    const nota = [data?.nota, extra].filter(Boolean).join(' · ')
    const { error } = await admin.from('agente_eventos').update({ nota }).eq('id', id)
    if (error) console.error('anotarEvento error:', error.message)
  } catch (err) {
    console.error('anotarEvento excepción:', (err as Error).message)
  }
}
