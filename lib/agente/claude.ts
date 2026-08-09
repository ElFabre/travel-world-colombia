import Anthropic from '@anthropic-ai/sdk'
import { INSTRUCCIONES, ESQUEMA_DECISION } from '@/lib/agente/prompt'
import { construirConocimiento } from '@/lib/agente/conocimiento'
import { resolverAudios } from '@/lib/agente/transcribir'
import { HORARIO } from '@/lib/agente/config'
import type { MensajeGhl } from '@/lib/agente/ghl'

export interface Decision {
  accion: 'responder' | 'callar' | 'escalar'
  motivo: string
  mensaje: string
  temperatura: 'caliente' | 'tibio' | 'frio' | 'no_interesado' | 'no_aplica'
  /** Qué tan pronto viaja, derivado de las fechas capturadas. Insumo de la urgencia. */
  proximidad_viaje?: 'inminente' | 'cercano' | 'lejano' | 'desconocido'
  datos: {
    nombre?: string
    destino?: string
    fechas?: string
    adultos?: number
    ninos?: number
    edades_ninos?: string
    ciudad_salida?: string
    presupuesto?: string
    duracion?: string
    habitaciones?: string
    fuente_lead?: string
  }
  /** El viaje es a la medida o fuera de catálogo (no un plan estándar). */
  viaje_personalizado?: boolean
  resumen?: string
  /** Cuándo y con qué ángulo volver a escribir si el cliente no contesta. */
  seguimiento?: { proximo_contacto: string; angulo: string }
  objeciones?: string
  idioma?: string
  confianza?: 'alta' | 'media' | 'baja'
}

let cliente: Anthropic | null = null
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY')
  cliente ??= new Anthropic()
  return cliente
}

/** El historial de GHL viene del más reciente al más antiguo. */
function aHistorial(mensajes: MensajeGhl[]): Anthropic.MessageParam[] {
  return [...mensajes]
    .reverse()
    .filter(m => (m.body ?? '').trim() !== '')
    .map(m => ({
      role: m.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
      content: m.body!.slice(0, 4000),
    }))
    // La API exige que el primer turno sea del usuario.
    .reduce<Anthropic.MessageParam[]>((acc, msg) => {
      if (acc.length === 0 && msg.role !== 'user') return acc
      // Turnos consecutivos del mismo rol se permiten, pero agruparlos ayuda
      // a que el modelo lea las ráfagas de WhatsApp como un solo mensaje.
      const ultimo = acc[acc.length - 1]
      if (ultimo && ultimo.role === msg.role) {
        ultimo.content = `${ultimo.content}\n${msg.content}`
        return acc
      }
      acc.push(msg)
      return acc
    }, [])
}

/**
 * Decide qué hacer con una conversación.
 *
 * El prompt se arma en dos bloques: instrucciones + catálogo (estable, se
 * cachea) y el historial (variable). El `cache_control` va al final del bloque
 * estable para que las conversaciones siguientes lo lean del caché en vez de
 * re-procesarlo — es la diferencia entre centavos y dólares con este volumen.
 */
export async function decidir(
  mensajes: MensajeGhl[],
  contexto: {
    nombre?: string
    /** Nombre real ya capturado (ia__nombre): si viene, Sol NO lo repregunta. */
    nombreConfirmado?: string
    canal?: string
    enHorario: boolean
    /** Primer contacto: el saludo + aviso de datos salen aparte, Sol no debe re-presentarse. */
    primerContacto?: boolean
    /** Presente cuando el turno lo dispara un seguimiento programado, no un mensaje del cliente. */
    seguimiento?: { intento: number; maximo: number; angulo?: string }
  }
): Promise<Decision> {
  // Las notas de voz llegan como audio; Claude no lo lee, así que se transcriben
  // (con caché) y quedan como texto antes de armar el historial.
  const conTexto = await resolverAudios(mensajes)
  const historial = aHistorial(conTexto)
  if (historial.length === 0) {
    return {
      accion: 'callar',
      motivo: 'la conversación no tiene mensajes de texto legibles',
      mensaje: '',
      temperatura: 'no_aplica',
      datos: {},
    }
  }

  const { base, detallesPara } = await construirConocimiento()

  // Detalle completo SOLO de los destinos que el cliente ya mencionó (el índice
  // ligero va siempre en el bloque cacheado; esto es la capa "bajo demanda").
  const textoConversacion = historial
    .map(m => (typeof m.content === 'string' ? m.content : ''))
    .join(' ')
  const detalleDestinos = detallesPara(textoConversacion)

  // Fecha con día de la semana: sin ella el modelo no puede programar
  // seguimientos ("en 3 días", "el lunes") ni esquivar los domingos.
  const hoy = new Date()
  const fechaLarga = new Intl.DateTimeFormat('es-CO', {
    timeZone: HORARIO.zona,
    dateStyle: 'full',
  }).format(hoy)
  const fechaIso = new Intl.DateTimeFormat('en-CA', { timeZone: HORARIO.zona }).format(hoy)

  const situacion = [
    `Hoy es ${fechaLarga} (${fechaIso}), hora de Colombia.`,
    contexto.nombreConfirmado
      ? `El cliente se llama ${contexto.nombreConfirmado} (nombre confirmado). Salúdalo así y NO le preguntes el nombre.`
      : contexto.nombre
        ? `En WhatsApp figura como "${contexto.nombre}", pero ese nombre puede NO ser el suyo real. Pregúntale su nombre (o confírmalo) UNA vez, con naturalidad; si no lo da, no insistas.`
        : 'No sabes su nombre; pregúntaselo una vez, con naturalidad, sin insistir.',
    contexto.canal ? `Canal: ${contexto.canal}.` : null,
    contexto.primerContacto
      ? 'Es el PRIMER mensaje de este contacto: por separado ya se le envía el saludo con tu nombre y el aviso de datos. NO te vuelvas a presentar ni saludes con "Soy Sol". Salúdalo con calidez, pregúntale su nombre y qué viaje tiene en mente, y sigue SU conversación. En este primer mensaje NO listes destinos ni precios del catálogo: esas recomendaciones son solo para cuando pregunte o mencione un destino o tipo de viaje.'
      : null,
    contexto.seguimiento
      ? `Este turno es un SEGUIMIENTO programado (intento ${contexto.seguimiento.intento} de ${contexto.seguimiento.maximo}): el cliente NO ha contestado tu último mensaje; no hay mensaje nuevo suyo.${contexto.seguimiento.angulo ? ` Ángulo que dejaste anotado: ${contexto.seguimiento.angulo}` : ''}`
      : null,
    contexto.enHorario
      ? 'Estás dentro del horario de atención: si escalas, una asesora puede responder hoy.'
      : 'Estás FUERA del horario de atención: si escalas, avísale que una asesora le escribe cuando abran, sin prometer una hora exacta.',
  ]
    .filter(Boolean)
    .join(' ')

  const respuesta = await anthropic().messages.create({
    model: 'claude-opus-5',
    max_tokens: 4000,
    system: [
      { type: 'text', text: INSTRUCCIONES },
      // TTL de 1 hora en vez de los 5 minutos por defecto. El bloque cacheado
      // (instrucciones + índice ligero del catálogo) es IDÉNTICO para todas las
      // conversaciones, así que cualquier mensaje de cualquier cliente lo
      // mantiene caliente. Medido: escribir el caché cuesta ~5x lo que cuesta
      // leerlo, y en WhatsApp los mensajes llegan espaciados — con 5 minutos
      // casi siempre se pagaría la escritura. El detalle pesado NO va aquí: se
      // inyecta fresco por turno (ver detalleDestinos) solo cuando hace falta.
      { type: 'text', text: base, cache_control: { type: 'ephemeral', ttl: '1h' } },
    ],
    messages: [
      ...historial,
      {
        role: 'system',
        content: detalleDestinos
          ? `${situacion}\n\n## Detalle de los destinos que interesan al cliente\n\n${detalleDestinos}`
          : situacion,
      },
    ],
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: ESQUEMA_DECISION as never },
    },
  })

  if (respuesta.stop_reason === 'refusal') {
    return {
      accion: 'escalar',
      motivo: `el modelo declinó responder (${respuesta.stop_details?.category ?? 'sin categoría'})`,
      mensaje: 'Déjame pasarte con una de nuestras asesoras para ayudarte mejor 😊',
      temperatura: 'no_aplica',
      datos: {},
    }
  }

  const texto = respuesta.content.find(b => b.type === 'text')
  if (!texto || texto.type !== 'text') {
    throw new Error('La respuesta del modelo no trae texto')
  }
  return JSON.parse(texto.text) as Decision
}
