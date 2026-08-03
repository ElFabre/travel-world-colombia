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

async function enviar<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const res = await fetch(`${GHL.api}${ruta}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      Version: GHL.version,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    throw new Error(`GHL ${ruta} respondió ${res.status}: ${detalle.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

/**
 * Envía un mensaje al cliente y devuelve el messageId que asigna GHL.
 *
 * Ese id se guarda en `agente_mensajes_enviados`: es la primera capa del
 * anti-bucle, porque el mismo mensaje vuelve por el webhook como saliente y hay
 * que reconocerlo como propio.
 */
export async function enviarMensaje(
  contactId: string,
  texto: string,
  tipo = 'WhatsApp'
): Promise<{ messageId?: string; conversationId?: string }> {
  const r = await enviar<{ messageId?: string; conversationId?: string }>(
    '/conversations/messages',
    { type: tipo, contactId, message: texto }
  )
  return { messageId: r.messageId, conversationId: r.conversationId }
}

/** Agrega tags al contacto (escalada, estado, fuera de alcance). */
export async function agregarTags(contactId: string, tags: string[]): Promise<void> {
  await enviar(`/contacts/${contactId}/tags`, { tags })
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
