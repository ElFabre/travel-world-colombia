import { GHL } from '@/lib/agente/config'

/**
 * Cliente de la API de GoHighLevel.
 *
 * Existe porque el webhook de GHL manda MUY poco: solo `{id, name, email,
 * phone}` del contacto — ni el texto del mensaje, ni la conversación, ni la
 * dirección (verificado con tráfico real el 2026-08-03). Así que el webhook
 * funciona como "campanazo" y los datos de verdad se piden por aquí.
 *
 * Además es más confiable que configurar merge fields en la acción del
 * webhook: por API llegan también el `userId` y los registros de actividad
 * (`CONVERSATIONS_AI`) que necesitamos para saber quién escribió.
 */

function token(): string {
  const t = process.env.GHL_TWC_PIT
  if (!t) throw new Error('Falta GHL_TWC_PIT')
  return t
}

async function pedir<T>(ruta: string): Promise<T> {
  const res = await fetch(`${GHL.api}${ruta}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Version: GHL.version,
      Accept: 'application/json',
    },
    // Datos vivos: nunca cachear respuestas del CRM.
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`GHL ${ruta} respondió ${res.status}`)
  return res.json() as Promise<T>
}

export interface ContactoGhl {
  id: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  tags?: string[]
}

export interface MensajeGhl {
  id: string
  direction?: string
  body?: string
  messageType?: string
  userId?: string
  dateAdded?: string
  attachments?: string[]
}

export interface ConversacionGhl {
  id: string
  contactId?: string
  lastMessageDirection?: string
  unreadCount?: number
}

export async function obtenerContacto(contactId: string): Promise<ContactoGhl | null> {
  const r = await pedir<{ contact?: ContactoGhl }>(`/contacts/${contactId}`)
  return r.contact ?? null
}

/** Conversación más reciente de un contacto. */
export async function conversacionDe(contactId: string): Promise<ConversacionGhl | null> {
  const r = await pedir<{ conversations?: ConversacionGhl[] }>(
    `/conversations/search?locationId=${GHL.locationId}&contactId=${contactId}&limit=1`
  )
  return r.conversations?.[0] ?? null
}

/** Últimos mensajes de una conversación, del más reciente al más antiguo. */
export async function ultimosMensajes(conversationId: string, limite = 10): Promise<MensajeGhl[]> {
  const r = await pedir<{ messages?: { messages?: MensajeGhl[] } }>(
    `/conversations/${conversationId}/messages?limit=${limite}`
  )
  return r.messages?.messages ?? []
}
