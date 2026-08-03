import { createAdminClient } from '@/lib/supabase/admin'

export type Autor = 'cliente' | 'sol' | 'bot_actual' | 'humano' | 'desconocido'

interface Entrada {
  direccion?: string
  messageId?: string
  /** Payload crudo: ahí buscamos las huellas del bot actual. */
  payload: unknown
}

/**
 * ¿Quién escribió este mensaje?
 *
 * Se resuelve POR ELIMINACIÓN, porque el `userId` no basta: el bot actual
 * ("Sol" de zolutium-ai) envía con la identidad de una asesora real
 * (Alejandra Mayorga), así que un mensaje suyo y uno de ella se ven igual en
 * ese campo. Verificado leyendo el JSON crudo de mensajes reales el 2026-07-31.
 *
 *   1. entrante                          → cliente
 *   2. saliente con message_id nuestro   → sol (anti-bucle)
 *   3. saliente con huella CONVERSATIONS_AI → bot_actual
 *   4. cualquier otro saliente           → humano (asesora, da igual si escribió
 *                                          desde el chat de GHL o desde el celular)
 *
 * El caso 4 es el que silencia a Sol: si una persona tomó la conversación, se
 * calla. Por eso se resuelve por eliminación y no por lista blanca.
 */
export async function identificarAutor({ direccion, messageId, payload }: Entrada): Promise<{
  autor: Autor
  nota: string
}> {
  if (direccion === 'inbound') return { autor: 'cliente', nota: 'mensaje entrante' }

  if (direccion !== 'outbound') {
    return { autor: 'desconocido', nota: `dirección no reconocida: ${direccion ?? 'ausente'}` }
  }

  // 2. ¿Lo enviamos nosotros?
  if (messageId) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('agente_mensajes_enviados')
      .select('message_id')
      .eq('message_id', messageId)
      .maybeSingle()

    if (error) console.error('identificarAutor: error consultando enviados:', error.message)
    if (data) return { autor: 'sol', nota: 'message_id en nuestro registro de enviados' }
  }

  // 3. ¿Huella del AI Employee de GHL (el bot actual)?
  const crudo = JSON.stringify(payload)
  if (crudo.includes('CONVERSATIONS_AI') || crudo.includes('employee_action_log')) {
    return { autor: 'bot_actual', nota: 'huella CONVERSATIONS_AI en el payload' }
  }

  // 4. Por eliminación: lo escribió una persona del equipo.
  const desdeCelular = crudo.includes('Sent from another device')
  return {
    autor: 'humano',
    nota: desdeCelular
      ? 'saliente sin huella de IA, con marca de otro dispositivo (celular)'
      : 'saliente sin huella de IA (chat de GHL)',
  }
}
