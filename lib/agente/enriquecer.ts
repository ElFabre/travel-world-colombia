import { conversacionDe, obtenerContacto, ultimosMensajes, type MensajeGhl } from '@/lib/agente/ghl'
import { TAGS } from '@/lib/agente/config'

export interface EventoEnriquecido {
  conversationId?: string
  messageId?: string
  direccion?: string
  canal?: string
  cuerpo?: string
  userId?: string
  /** Payload crudo del mensaje real: de ahí sale la huella del bot actual. */
  mensajeCrudo?: MensajeGhl
  tagsContacto: string[]
  esNoCliente: boolean
  nota: string[]
}

/**
 * El webhook solo trae el contacto, así que aquí se pide a la API lo que hace
 * falta: la conversación, el último mensaje y los tags del contacto.
 *
 * Nunca lanza: si la API falla, se registra igual el evento con lo poco que
 * haya. Perder un dato es aceptable; perder el evento entero, no.
 */
export async function enriquecerDesdeContacto(contactId: string): Promise<EventoEnriquecido> {
  const nota: string[] = []
  const salida: EventoEnriquecido = { tagsContacto: [], esNoCliente: false, nota }

  // Tags del contacto: la compuerta barata para proveedores y mayoristas.
  try {
    const contacto = await obtenerContacto(contactId)
    salida.tagsContacto = contacto?.tags ?? []
    salida.esNoCliente = salida.tagsContacto.some(t =>
      (TAGS.noCliente as readonly string[]).includes(t)
    )
    if (salida.esNoCliente) nota.push('contacto etiquetado como proveedor/mayorista')
  } catch (err) {
    nota.push(`no se pudo leer el contacto: ${(err as Error).message}`)
  }

  // Conversación y último mensaje.
  try {
    const conv = await conversacionDe(contactId)
    if (!conv) {
      nota.push('el contacto no tiene conversación')
      return salida
    }
    salida.conversationId = conv.id

    const mensajes = await ultimosMensajes(conv.id, 1)
    const ultimo = mensajes[0]
    if (!ultimo) {
      nota.push('conversación sin mensajes')
      return salida
    }

    salida.messageId = ultimo.id
    salida.direccion = ultimo.direction
    salida.canal = ultimo.messageType
    salida.cuerpo = ultimo.body
    salida.userId = ultimo.userId
    salida.mensajeCrudo = ultimo
    nota.push('enriquecido por API')
  } catch (err) {
    nota.push(`no se pudo leer la conversación: ${(err as Error).message}`)
  }

  return salida
}
