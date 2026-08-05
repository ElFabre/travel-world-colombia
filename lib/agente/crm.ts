import {
  actualizarCampos,
  crearNota,
  listarCamposPersonalizados,
  moverOportunidad,
  oportunidadesDe,
} from '@/lib/agente/ghl'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CAMPOS_CALIFICACION,
  HORARIO,
  MAX_INTENTOS_SEGUIMIENTO,
  PIPELINE,
} from '@/lib/agente/config'
import type { Decision } from '@/lib/agente/claude'

/**
 * Fase 3: la mano de Sol sobre el CRM.
 *
 * Cada turno del modelo ya devuelve `datos` y `resumen` estructurados; aquí se
 * escriben en GoHighLevel para que las asesoras y los workflows los vean:
 *
 * 1. La calificación va a los campos EXISTENTES del folder ⭐ de la cuenta
 *    (reusar, no duplicar: los workflows dependen de ellos).
 * 2. Al escalar queda una nota interna con el briefing para la asesora.
 * 3. Con destino + fechas + pasajeros, la oportunidad sube de "Lead Nuevo" a
 *    "Calificado por Bot" — nunca al revés, y solo desde Lead Nuevo: cualquier
 *    etapa posterior la puso un humano y no se toca.
 * 4. Los campos `sol_*` (§6.2 del diseño) se escriben SOLO si ya existen: el
 *    usuario los crea en la UI de GHL y aquí se detectan solos, sin deploy.
 *
 * Nada de lo que pase aquí puede tumbar el turno ni dejar al cliente sin
 * respuesta: cada paso captura su propio error y lo devuelve como nota de
 * bitácora para `agente_eventos`.
 */

export interface EntradaCrm {
  contactId: string
  conversationId?: string
  canal?: string
  decision: Decision
  /**
   * Seguimientos sin respuesta acumulados, contando este turno. Un turno
   * normal (el cliente escribió) es 0: el contador se reinicia solo.
   */
  intentos?: number
}

export async function sincronizarCrm(e: EntradaCrm): Promise<string[]> {
  const notas: string[] = []

  // Secuencial a propósito: dos PUT al mismo contacto en paralelo se pisan.
  const paso = async (nombre: string, fn: () => Promise<string | null>) => {
    try {
      const nota = await fn()
      if (nota) notas.push(nota)
    } catch (err) {
      notas.push(`CRM ${nombre} falló: ${(err as Error).message}`)
    }
  }

  await paso('calificación', () => guardarCalificacion(e))
  await paso('campos sol', () => escribirCamposSol(e))
  if (e.decision.accion === 'escalar') {
    await paso('nota', () => dejarNotaDeEscalada(e))
  }
  await paso('pipeline', () => moverSiCalificado(e))
  await paso('agenda', () => programarSeguimiento(e))

  return notas
}

/** Calificado = lo mínimo para que una asesora cotice sin re-preguntar. */
function estaCalificado(d: Decision['datos']): boolean {
  const pax = (d.adultos ?? 0) + (d.ninos ?? 0)
  return Boolean(d.destino?.trim() && d.fechas?.trim() && pax > 0)
}

async function guardarCalificacion({ contactId, decision }: EntradaCrm): Promise<string | null> {
  const d = decision.datos
  const campos: { id: string; field_value: string | number }[] = []
  const escritos: string[] = []

  const texto = (id: string, nombre: string, valor?: string) => {
    if (valor?.trim()) {
      campos.push({ id, field_value: valor.trim() })
      escritos.push(nombre)
    }
  }

  texto(CAMPOS_CALIFICACION.destino, 'destino', d.destino)
  texto(CAMPOS_CALIFICACION.fechas, 'fechas', d.fechas)
  texto(CAMPOS_CALIFICACION.ciudadSalida, 'ciudad de salida', d.ciudad_salida)
  texto(CAMPOS_CALIFICACION.edadesNinos, 'edades niños', d.edades_ninos)
  texto(CAMPOS_CALIFICACION.duracion, 'duración', d.duracion)
  texto(CAMPOS_CALIFICACION.habitaciones, 'habitaciones', d.habitaciones)
  texto(CAMPOS_CALIFICACION.fuenteLead, 'fuente', d.fuente_lead)

  if (typeof d.adultos === 'number' && d.adultos > 0) {
    campos.push({ id: CAMPOS_CALIFICACION.adultos, field_value: d.adultos })
    escritos.push('adultos')
  }
  // 0 niños es un dato real ("viajamos solos"), no una ausencia.
  if (typeof d.ninos === 'number' && d.ninos >= 0) {
    campos.push({ id: CAMPOS_CALIFICACION.ninos, field_value: d.ninos })
    escritos.push('niños')
  }

  if (d.presupuesto?.trim()) {
    const monto = presupuestoANumero(d.presupuesto)
    // El campo es MONETORY: si la cifra no es clara ("algo económico"), mejor
    // no escribir que escribir basura. El texto igual queda en el resumen.
    if (monto !== null) {
      campos.push({ id: CAMPOS_CALIFICACION.presupuesto, field_value: monto })
      escritos.push('presupuesto')
    }
  }

  // Nivel de urgencia: se deriva de la temperatura (no se le pregunta al cliente).
  const urgencia = urgenciaDeTemperatura(decision.temperatura)
  if (urgencia) {
    campos.push({ id: CAMPOS_CALIFICACION.nivelUrgencia, field_value: urgencia })
    escritos.push('urgencia')
  }

  // Viaje a la medida: solo se marca "yes" cuando el modelo lo detecta; un plan
  // estándar del catálogo no toca el campo (para no pisar lo que ponga una asesora).
  if (decision.viaje_personalizado === true) {
    campos.push({ id: CAMPOS_CALIFICACION.viajePersonalizado, field_value: 'yes' })
    escritos.push('personalizado')
  }

  // El brief para cotizar: se llena cuando el lead ya está listo (calificado o
  // escalado), reusando el resumen que redacta Sol para la asesora.
  const brief = componerBrief(decision)
  if (brief) {
    campos.push({ id: CAMPOS_CALIFICACION.mensajeCotizacion, field_value: brief })
    escritos.push('brief cotización')
  }

  if (campos.length === 0) return null
  await actualizarCampos(contactId, campos)
  return `calificación guardada (${escritos.join(', ')})`
}

/** Temperatura del lead → texto para el campo "Nivel de urgencia". */
function urgenciaDeTemperatura(temp: Decision['temperatura']): string | null {
  switch (temp) {
    case 'caliente':
      return 'Alta'
    case 'tibio':
      return 'Media'
    case 'frio':
      return 'Baja'
    default:
      return null // no_interesado / no_aplica: no es una urgencia
  }
}

/**
 * El "Mensaje de cotización": el brief que la asesora lee para cotizar sin
 * re-preguntar. Se arma con los datos capturados y el resumen que redacta Sol,
 * y solo cuando el lead ya está listo (calificado o escalado).
 */
function componerBrief(decision: Decision): string | null {
  const listo = decision.accion === 'escalar' || estaCalificado(decision.datos)
  if (!listo) return null

  const d = decision.datos
  const viajeros = [
    d.adultos ? `${d.adultos} adulto(s)` : null,
    d.ninos ? `${d.ninos} niño(s)${d.edades_ninos ? ` de ${d.edades_ninos}` : ''}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const lineas = [
    d.destino ? `Destino: ${d.destino}` : null,
    d.fechas ? `Fechas: ${d.fechas}` : null,
    d.duracion ? `Duración: ${d.duracion}` : null,
    viajeros ? `Viajeros: ${viajeros}` : null,
    d.ciudad_salida ? `Sale de: ${d.ciudad_salida}` : null,
    d.habitaciones ? `Acomodación: ${d.habitaciones}` : null,
    d.presupuesto ? `Presupuesto: ${d.presupuesto}` : null,
    decision.viaje_personalizado ? 'Viaje a la medida / fuera de catálogo' : null,
    decision.objeciones?.trim() ? `Objeciones: ${decision.objeciones.trim()}` : null,
  ].filter(Boolean)

  const cuerpo = [decision.resumen?.trim() || null, lineas.length ? lineas.join('\n') : null]
    .filter(Boolean)
    .join('\n\n')

  return cuerpo || null
}

/** "5 millones", "$4.500.000", "2500 USD", "2k" → número para el campo MONETORY. */
function presupuestoANumero(texto: string): number | null {
  const sinSeparadorDeMiles = texto.replace(/[.,](?=\d{3}(\D|$))/g, '')
  const m = sinSeparadorDeMiles.match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return null

  let n = parseFloat(m[1].replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null

  if (/mill/i.test(texto)) n *= 1_000_000
  else if (/\d\s*k\b/i.test(texto)) n *= 1_000
  return Math.round(n)
}

/**
 * Los campos `sol_*` los crea el usuario en la UI de GHL (la propuesta está en
 * §6.2 del diseño). Aquí solo se escriben los que EXISTAN, así el código no
 * depende de que estén creados y empiezan a llenarse solos cuando aparezcan.
 *
 * La lista de campos de la cuenta se cachea 10 minutos: es un catálogo casi
 * estático y no vale la pena pedirlo en cada mensaje.
 */
let cacheCamposSol: { porClave: Map<string, string>; expira: number } | null = null

async function camposSolExistentes(): Promise<Map<string, string>> {
  if (cacheCamposSol && cacheCamposSol.expira > Date.now()) return cacheCamposSol.porClave

  const porClave = new Map<string, string>()
  for (const campo of await listarCamposPersonalizados()) {
    const clave = campo.fieldKey?.replace(/^contact\./, '')
    if (clave?.startsWith('sol_')) porClave.set(clave, campo.id)
  }
  cacheCamposSol = { porClave, expira: Date.now() + 10 * 60_000 }
  return porClave
}

async function escribirCamposSol(e: EntradaCrm): Promise<string | null> {
  const { contactId, canal, decision } = e
  const existentes = await camposSolExistentes()
  if (existentes.size === 0) return null // aún no los crean; silencio, sin error

  const dormido = (e.intentos ?? 0) >= MAX_INTENTOS_SEGUIMIENTO
  const valores: Record<string, string | number | undefined> = {
    sol_estado: derivarEstado(decision, dormido),
    sol_temperatura: decision.temperatura === 'no_aplica' ? undefined : decision.temperatura,
    sol_resumen: decision.resumen?.trim() || undefined,
    sol_ultima_interaccion: fechaBogota(),
    sol_canal: canalNormalizado(canal),
    sol_proximo_seguimiento: proximoSeguimientoValido(decision),
    sol_intentos_seguimiento: e.intentos,
    sol_objeciones: decision.objeciones?.trim() || undefined,
    sol_idioma: decision.idioma?.trim() || undefined,
    sol_confianza: decision.confianza,
    sol_motivo_cierre:
      decision.temperatura === 'no_interesado'
        ? decision.motivo
        : dormido
          ? `sin respuesta tras ${MAX_INTENTOS_SEGUIMIENTO} seguimientos`
          : undefined,
  }

  const campos = Object.entries(valores)
    .filter((par): par is [string, string | number] => par[1] !== undefined && existentes.has(par[0]))
    .map(([clave, valor]) => ({ id: existentes.get(clave)!, field_value: valor }))

  if (campos.length === 0) return null
  await actualizarCampos(contactId, campos)
  return `sol_* actualizados (${campos.length})`
}

function derivarEstado(decision: Decision, dormido = false): string {
  if (decision.accion === 'escalar') return 'escalado'
  if (decision.temperatura === 'no_interesado') return 'no_interesado'
  if (dormido) return 'dormido'
  if (estaCalificado(decision.datos)) return 'calificado'
  return 'conversando'
}

/** Fecha local de Colombia en YYYY-MM-DD (formato que aceptan los campos DATE). */
export function fechaBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: HORARIO.zona }).format(new Date())
}

/**
 * La fecha de seguimiento que propone el modelo, saneada: formato YYYY-MM-DD y
 * en el futuro. Cualquier otra cosa se descarta — mejor un lead sin seguimiento
 * que un runner persiguiendo fechas del pasado en bucle.
 */
function proximoSeguimientoValido(decision: Decision): string | undefined {
  const fecha = decision.seguimiento?.proximo_contacto?.trim()
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return undefined
  return fecha > fechaBogota() ? fecha : undefined
}

function canalNormalizado(canal?: string): string | undefined {
  if (!canal) return undefined
  const c = canal.toLowerCase()
  if (c.includes('whatsapp')) return 'whatsapp'
  if (c.includes('instagram')) return 'instagram'
  if (c.includes('facebook')) return 'facebook'
  if (c.includes('chat')) return 'widget' // TYPE_LIVE_CHAT / webchat
  return undefined
}

/**
 * El briefing que hoy no existe: la asesora entra a cerrar, no a re-preguntar.
 * Se deja como nota interna del contacto en el momento de escalar.
 */
async function dejarNotaDeEscalada({ contactId, decision }: EntradaCrm): Promise<string | null> {
  const d = decision.datos

  const viajeros = [
    d.adultos ? `${d.adultos} adulto(s)` : null,
    d.ninos ? `${d.ninos} niño(s)${d.edades_ninos ? ` de ${d.edades_ninos}` : ''}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const datos = [
    d.destino ? `Destino: ${d.destino}` : null,
    d.fechas ? `Fechas: ${d.fechas}` : null,
    viajeros ? `Viajeros: ${viajeros}` : null,
    d.ciudad_salida ? `Sale de: ${d.ciudad_salida}` : null,
    d.presupuesto ? `Presupuesto: ${d.presupuesto}` : null,
  ].filter(Boolean)

  const texto = [
    '🤖 Sol escaló esta conversación.',
    decision.resumen?.trim() || `Motivo: ${decision.motivo}`,
    datos.length ? `Datos capturados:\n- ${datos.join('\n- ')}` : null,
    decision.temperatura !== 'no_aplica' ? `Temperatura: ${decision.temperatura}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')

  await crearNota(contactId, texto)
  return 'nota interna con el briefing'
}

/**
 * ⚠️ Mover a "Calificado por Bot" dispara el workflow "2.-Calificado por Bot"
 * (v45) de la cuenta. Revisar en la UI qué hace ANTES de encender a Sol en
 * producción — la etapa lleva meses en 0 usos y ese workflow nunca se ha
 * ejecutado con datos del agente.
 */
async function moverSiCalificado({ contactId, decision }: EntradaCrm): Promise<string | null> {
  if (!estaCalificado(decision.datos)) return null

  const oportunidades = await oportunidadesDe(contactId)
  const abierta = oportunidades.find(o => o.pipelineId === PIPELINE.id && o.status === 'open')

  if (!abierta) {
    return 'calificado, pero sin oportunidad abierta en el pipeline principal (no se movió nada)'
  }
  if (abierta.pipelineStageId === PIPELINE.etapas.calificadoPorBot) return null
  if (abierta.pipelineStageId !== PIPELINE.etapas.leadNuevo) {
    return 'calificado, pero la oportunidad ya pasó de Lead Nuevo (territorio humano, no se toca)'
  }

  await moverOportunidad(abierta.id, PIPELINE.id, PIPELINE.etapas.calificadoPorBot)
  return 'oportunidad movida a "Calificado por Bot"'
}

/**
 * Cola operativa del seguimiento dinámico (§5): una fila por contacto en
 * `agente_seguimientos`, que el runner de /api/agente/seguimiento consume.
 * Los campos `sol_*` de GHL son el espejo visible; esta cola es la que manda.
 */
async function programarSeguimiento(e: EntradaCrm): Promise<string | null> {
  if (!e.conversationId) return null // sin conversación no hay a qué volver

  const d = e.decision
  const intentos = e.intentos ?? 0
  const fecha = proximoSeguimientoValido(d)

  let fila: { estado: string; programado_para: string | null; nota: string | null }
  if (d.accion === 'escalar') {
    fila = { estado: 'cerrado', programado_para: null, nota: 'escalado a una asesora' }
  } else if (d.temperatura === 'no_interesado') {
    fila = { estado: 'cerrado', programado_para: null, nota: d.motivo }
  } else if (intentos >= MAX_INTENTOS_SEGUIMIENTO) {
    fila = {
      estado: 'dormido',
      programado_para: null,
      nota: `sin respuesta tras ${MAX_INTENTOS_SEGUIMIENTO} seguimientos`,
    }
  } else if (fecha) {
    fila = { estado: 'pendiente', programado_para: fecha, nota: d.seguimiento?.angulo ?? null }
  } else {
    fila = { estado: 'cerrado', programado_para: null, nota: 'sin seguimiento programado' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('agente_seguimientos').upsert({
    contact_id: e.contactId,
    conversation_id: e.conversationId,
    canal: canalNormalizado(e.canal) ?? null,
    intentos,
    actualizado_en: new Date().toISOString(),
    ...fila,
  })
  if (error) throw new Error(error.message)

  return fila.estado === 'pendiente'
    ? `seguimiento programado para ${fila.programado_para}`
    : `seguimiento: ${fila.estado}`
}
