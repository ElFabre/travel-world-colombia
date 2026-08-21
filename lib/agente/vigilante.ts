import { createAdminClient } from '@/lib/supabase/admin'
import { enHorario } from '@/lib/agente/conversacion'
import { obtenerContacto, ultimosMensajes, agregarTags, quitarTags, type MensajeGhl } from '@/lib/agente/ghl'
import { TAGS } from '@/lib/agente/config'

/**
 * Vigilante silencioso de Sol.
 *
 * Sol ya "ve" cada mensaje entrante (queda en `agente_eventos`) y sabe leer una
 * conversación. Esta corrida periódica cierra el hueco que GHL no cubre: detectar
 * un lead que lleva rato SIN que nadie responda y marcarlo para que un workflow
 * de GHL avise al usuario asignado.
 *
 * Por qué aquí y no en un trigger de GHL: el WhatsApp de la cuenta entra por un
 * proveedor custom, y los activadores de "mensaje saliente" de GHL no lo cubren.
 * Sol lee la conversación por API, así que funciona con cualquier canal.
 *
 * Reglas:
 *  - Solo corre DENTRO del horario de atención (si no hay asesoras, nadie va a
 *    contestar: marcar sería ruido). Reusa `enHorario`.
 *  - "Respondido" = hay CUALQUIER saliente real (Sol o humano) más nuevo que el
 *    último mensaje del cliente.
 *  - Idempotente: si ya está marcado, no re-marca; si ya respondieron, quita la
 *    marca (re-arma para una próxima vez).
 */

/** Minutos sin respuesta antes de marcar el lead. */
const SLA_MIN = 60
/** Cuánto hacia atrás se buscan conversaciones con actividad del cliente (cubre el cierre nocturno hasta la reapertura). */
const VENTANA_HORAS = 16
/** Tope de conversaciones por corrida, por si hay una avalancha. */
const MAX_POR_CORRIDA = 80

export interface ResumenVigilancia {
  corrio: boolean
  motivo?: string
  candidatos: number
  marcados: number
  limpiados: number
  errores: number
}

/** ¿Hay un saliente REAL (no actividad del sistema) más nuevo que el último entrante? */
function yaRespondieron(mensajes: MensajeGhl[]): { respondido: boolean; edadEntranteMin: number | null } {
  // `ultimosMensajes` llega del más reciente al más antiguo.
  const esReal = (m: MensajeGhl) =>
    Boolean(m.messageType) && !m.messageType!.startsWith('TYPE_ACTIVITY')

  const idxEntrante = mensajes.findIndex(m => m.direction === 'inbound' && esReal(m))
  if (idxEntrante === -1) return { respondido: true, edadEntranteMin: null } // sin entrante real: no es candidato

  const entrante = mensajes[idxEntrante]
  const edadEntranteMin = entrante.dateAdded
    ? (Date.now() - new Date(entrante.dateAdded).getTime()) / 60000
    : null

  // Cualquier saliente real por delante del último entrante = alguien respondió.
  const respondido = mensajes
    .slice(0, idxEntrante)
    .some(m => m.direction === 'outbound' && esReal(m))

  return { respondido, edadEntranteMin }
}

export async function correrVigilancia(
  opciones: { dry?: boolean; ahora?: Date } = {}
): Promise<ResumenVigilancia> {
  const ahora = opciones.ahora ?? new Date()
  const dry = opciones.dry ?? false

  if (!enHorario(ahora)) {
    return { corrio: false, motivo: 'fuera de horario de atención', candidatos: 0, marcados: 0, limpiados: 0, errores: 0 }
  }

  const admin = createAdminClient()
  const desde = new Date(ahora.getTime() - VENTANA_HORAS * 3_600_000).toISOString()
  const hasta = new Date(ahora.getTime() - SLA_MIN * 60_000).toISOString()

  // Conversaciones con al menos un mensaje del cliente lo bastante viejo como
  // para haber pasado el SLA. Es solo la lista de CANDIDATAS: el estado real
  // (último entrante + si respondieron) se confirma con la API por conversación.
  const { data, error } = await admin
    .from('agente_eventos')
    .select('conversation_id, contact_id, recibido_en')
    .eq('autor', 'cliente')
    .not('conversation_id', 'is', null)
    .not('contact_id', 'is', null)
    .gte('recibido_en', desde)
    .lte('recibido_en', hasta)
    .order('recibido_en', { ascending: false })
    .limit(1000)

  if (error) throw new Error(`vigilante: no se pudo leer agente_eventos: ${error.message}`)

  // Una entrada por conversación (la más reciente ya viene primera por el orden).
  const porConversacion = new Map<string, string>() // conversationId -> contactId
  for (const e of data ?? []) {
    if (e.conversation_id && e.contact_id && !porConversacion.has(e.conversation_id)) {
      porConversacion.set(e.conversation_id, e.contact_id)
    }
  }

  const candidatas = [...porConversacion.entries()].slice(0, MAX_POR_CORRIDA)
  let marcados = 0
  let limpiados = 0
  let errores = 0

  for (const [conversationId, contactId] of candidatas) {
    try {
      const contacto = await obtenerContacto(contactId)
      const tags = contacto?.tags ?? []

      // Proveedores/mayoristas no son leads: nunca se marcan.
      if (tags.some(t => (TAGS.noCliente as readonly string[]).includes(t))) continue

      const yaMarcado = tags.includes(TAGS.sinRespuesta)
      const mensajes = await ultimosMensajes(conversationId, 15)
      const { respondido, edadEntranteMin } = yaRespondieron(mensajes)

      if (respondido) {
        // Ya contestaron (Sol o humano): limpiar la marca para re-armar.
        if (yaMarcado) {
          if (!dry) await quitarTags(contactId, [TAGS.sinRespuesta])
          limpiados++
        }
        continue
      }

      // Sin respuesta. Solo marca si el último mensaje del cliente ya pasó el SLA
      // (el cliente pudo haber escrito de nuevo hace poco → aún no toca).
      if (edadEntranteMin === null || edadEntranteMin < SLA_MIN) continue

      if (!yaMarcado) {
        if (!dry) await agregarTags(contactId, [TAGS.sinRespuesta])
        marcados++
      }
    } catch (err) {
      errores++
      console.error(`vigilante ${conversationId}:`, (err as Error).message)
    }
  }

  return { corrio: true, motivo: dry ? 'DRY RUN (no se escribieron tags)' : undefined, candidatos: candidatas.length, marcados, limpiados, errores }
}
