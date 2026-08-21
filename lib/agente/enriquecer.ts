import { conversacionDe, obtenerContacto, ultimosMensajes, type MensajeGhl } from '@/lib/agente/ghl'
import { CAMPO_IA_NOMBRE, TAGS } from '@/lib/agente/config'

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
  /** Nombre REAL ya capturado antes (campo ia__nombre). Si existe, Sol no lo repregunta. */
  nombreConfirmado?: string
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

    // Nombre real ya capturado (ia__nombre): si está, Sol no lo vuelve a pedir.
    const iaNombre = contacto?.customFields?.find(f => f.id === CAMPO_IA_NOMBRE)?.value
    if (typeof iaNombre === 'string' && iaNombre.trim()) {
      salida.nombreConfirmado = iaNombre.trim()
    }
  } catch (err) {
    nota.push(`no se pudo leer el contacto: ${(err as Error).message}`)
  }

  // Conversación y último mensaje.
  try {
    // Los leads de PRIMER CONTACTO llegan por webhook casi en el mismo instante
    // en que se crea el contacto, ANTES de que GHL indexe la conversación nueva:
    // la búsqueda devuelve vacío por una condición de carrera. Sin conversación,
    // Sol no puede identificar al autor ni responder, y el lead se pierde en
    // silencio (era una fuga real de leads nuevos). Reintentamos unas pocas veces
    // con espera corta para darle tiempo a GHL a indexar.
    let conv = await conversacionDe(contactId)
    for (let intento = 0; !conv && intento < 3; intento++) {
      await new Promise(r => setTimeout(r, 2000))
      conv = await conversacionDe(contactId)
    }
    if (!conv) {
      nota.push('el contacto no tiene conversación (tras reintentos)')
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
