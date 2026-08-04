import Anthropic from '@anthropic-ai/sdk'
import { INSTRUCCIONES, ESQUEMA_DECISION } from '@/lib/agente/prompt'
import { construirConocimiento } from '@/lib/agente/conocimiento'
import type { MensajeGhl } from '@/lib/agente/ghl'

export interface Decision {
  accion: 'responder' | 'callar' | 'escalar'
  motivo: string
  mensaje: string
  temperatura: 'caliente' | 'tibio' | 'frio' | 'no_interesado' | 'no_aplica'
  datos: {
    destino?: string
    fechas?: string
    adultos?: number
    ninos?: number
    edades_ninos?: string
    ciudad_salida?: string
    presupuesto?: string
  }
  resumen?: string
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
  contexto: { nombre?: string; canal?: string; enHorario: boolean }
): Promise<Decision> {
  const historial = aHistorial(mensajes)
  if (historial.length === 0) {
    return {
      accion: 'callar',
      motivo: 'la conversación no tiene mensajes de texto legibles',
      mensaje: '',
      temperatura: 'no_aplica',
      datos: {},
    }
  }

  const conocimiento = await construirConocimiento()

  const situacion = [
    contexto.nombre ? `El contacto se llama ${contexto.nombre}.` : null,
    contexto.canal ? `Canal: ${contexto.canal}.` : null,
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
      // (instrucciones + catálogo) es IDÉNTICO para todas las conversaciones,
      // así que cualquier mensaje de cualquier cliente lo mantiene caliente.
      // Medido: escribir el caché cuesta ~5x lo que cuesta leerlo, y en
      // WhatsApp los mensajes llegan espaciados — con 5 minutos casi siempre
      // se pagaría la escritura.
      { type: 'text', text: conocimiento, cache_control: { type: 'ephemeral', ttl: '1h' } },
    ],
    messages: [
      ...historial,
      { role: 'system', content: situacion },
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
