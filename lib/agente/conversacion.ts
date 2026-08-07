import { createAdminClient } from '@/lib/supabase/admin'
import { decidir, type Decision } from '@/lib/agente/claude'
import { agregarTags, enviarMensaje, rutaDeRespuesta, ultimosMensajes } from '@/lib/agente/ghl'
import { sincronizarCrm } from '@/lib/agente/crm'
import { ACTIVO_DESDE, AVISO_DATOS, HORARIO, RAFAGA_MS, TAGS, TAG_PRUEBAS } from '@/lib/agente/config'

/** ¿Estamos dentro del horario de atención de la agencia (hora de Colombia)? */
export function enHorario(ahora = new Date()): boolean {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: HORARIO.zona,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(ahora)

  const dia = f.find(p => p.type === 'weekday')?.value ?? ''
  const hora = Number(f.find(p => p.type === 'hour')?.value ?? -1)

  if (dia === 'Sun') return false
  if (dia === 'Sat') return hora >= HORARIO.sabado.desde && hora < HORARIO.sabado.hasta
  return hora >= HORARIO.semana.desde && hora < HORARIO.semana.hasta
}

/**
 * Espera la ventana de ráfaga y decide si a este mensaje le toca responder.
 *
 * La ventana es DESLIZANTE: si mientras esperamos llega otro mensaje del
 * cliente, cedemos el turno a ese (que a su vez esperará su propia ventana y
 * verá toda la conversación acumulada). Así una ráfaga de cuatro mensajes
 * separados por 8 segundos se agrupa entera aunque dure medio minuto.
 *
 * Se apoya en `agente_eventos`, donde el evento ya quedó registrado antes de
 * llamar aquí: basta con preguntar si existe uno más nuevo del cliente en la
 * misma conversación.
 *
 * @returns true si soy el último mensaje y debo atender; false si cedo el turno.
 */
export async function meTocaResponder(
  conversationId: string,
  recibidoEn: string
): Promise<boolean> {
  if (RAFAGA_MS <= 0) return true

  await new Promise(r => setTimeout(r, RAFAGA_MS))

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agente_eventos')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('autor', 'cliente')
    .gt('recibido_en', recibidoEn)
    .limit(1)

  // Ante un fallo de lectura preferimos atender: peor que responder de más es
  // que el cliente se quede sin respuesta.
  if (error) {
    console.error('meTocaResponder error:', error.message)
    return true
  }
  return (data?.length ?? 0) === 0
}

export interface ResultadoTurno {
  actuo: boolean
  decision?: Decision
  nota: string
}

interface Entrada {
  contactId: string
  conversationId: string
  /** Nombre de WhatsApp (puede no ser el real). */
  nombre?: string
  /** Nombre real ya capturado antes (ia__nombre): si existe, Sol no lo repregunta. */
  nombreConfirmado?: string
  canal?: string
  tags: string[]
  /** Fecha del mensaje que disparó el turno. */
  fechaMensaje?: Date
}

/**
 * Orquesta un turno de Sol: decide si debe intervenir, consulta al modelo,
 * envía la respuesta y registra el mensaje enviado.
 *
 * Las compuertas van ANTES del modelo — cada una que se cierra temprano es una
 * llamada que no se paga.
 */
export async function atender(e: Entrada): Promise<ResultadoTurno> {
  // 1. ¿Sol está encendido? (ACTIVO_DESDE por defecto está en 2099 = apagado)
  if (!e.fechaMensaje || e.fechaMensaje < ACTIVO_DESDE) {
    return { actuo: false, nota: 'anterior al encendido de Sol (o sin fecha)' }
  }

  // 2. Modo prueba: mientras convivimos con el bot actual, Sol solo habla con
  //    contactos etiquetados explícitamente.
  if (TAG_PRUEBAS && !e.tags.includes(TAG_PRUEBAS)) {
    return { actuo: false, nota: `modo prueba: falta el tag ${TAG_PRUEBAS}` }
  }

  // 3. Un humano tomó la conversación, o el contacto no es un cliente.
  if (e.tags.includes(TAGS.stopBot)) {
    return { actuo: false, nota: 'el contacto tiene stop_bot' }
  }
  if (e.tags.some(t => (TAGS.noCliente as readonly string[]).includes(t))) {
    return { actuo: false, nota: 'proveedor/mayorista' }
  }

  // 4. Historial y re-verificación anti-choque: si el último mensaje es
  //    saliente y NO es nuestro, una persona del equipo tomó el chat (desde el
  //    celular o desde el CRM). Ahí sí se apaga a Sol de forma permanente: el
  //    humano siempre gana. Esta es la ÚNICA vía por la que Sol se pone stop_bot
  //    a sí mismo — escalar ya no lo hace (ver más abajo).
  const mensajes = await ultimosMensajes(e.conversationId, 20)
  const ultimo = mensajes[0]
  if (ultimo?.direction === 'outbound' && !(await esNuestro(ultimo.id))) {
    await agregarTags(e.contactId, [TAGS.stopBot])
    return { actuo: false, nota: 'un humano tomó el chat; Sol se apaga (stop_bot)' }
  }

  // Primer contacto = todavía no tiene el tag del aviso de datos. Si Sol habla,
  // el aviso saldrá aparte antes de su respuesta, así que no debe re-presentarse.
  const primerContacto = !e.tags.includes(TAGS.avisoDatos)

  const decision = await decidir(mensajes, {
    nombre: e.nombre,
    nombreConfirmado: e.nombreConfirmado,
    canal: e.canal,
    enHorario: enHorario(),
    primerContacto,
  })

  // Primero la voz, después la mano: el mensaje al cliente sale de inmediato y
  // la escritura en el CRM va al final, donde un fallo ya no le quita respuesta
  // a nadie (sincronizarCrm nunca lanza: reporta cada tropiezo como nota).
  const habla = decision.accion !== 'callar' && decision.mensaje.trim() !== ''

  if (habla) {
    // Por el mismo canal por el que escribió el cliente (custom provider incluido).
    const ruta = rutaDeRespuesta(mensajes)

    // Aviso de tratamiento de datos (Ley 1581): una sola vez, como mensaje
    // aparte, ANTES de la primera respuesta real de Sol. Determinístico (texto
    // legal). Si falla, se reintenta el próximo turno (el tag no se pone) y no
    // se le quita la respuesta al cliente.
    if (primerContacto) {
      try {
        const aviso = await enviarMensaje(e.contactId, AVISO_DATOS, ruta)
        if (aviso.messageId) await registrarEnviado(aviso.messageId, e.conversationId, e.contactId)
        await agregarTags(e.contactId, [TAGS.avisoDatos])
      } catch (err) {
        console.error('aviso de datos falló:', (err as Error).message)
      }
    }

    const { messageId } = await enviarMensaje(e.contactId, decision.mensaje.trim(), ruta)
    if (messageId) await registrarEnviado(messageId, e.conversationId, e.contactId)
  }

  // Escalar avisa al equipo (dispara la notificación) pero NO apaga a Sol: queda
  // en "espera caliente" acompañando al cliente hasta que una persona tome el
  // chat. El stop_bot lo pone la detección de intervención humana (compuerta 4).
  if (decision.accion === 'escalar') {
    await agregarTags(e.contactId, [TAGS.transferenciaHumano])
  }

  const notasCrm = await sincronizarCrm({
    contactId: e.contactId,
    conversationId: e.conversationId,
    canal: e.canal,
    decision,
    tags: e.tags, // snapshot del turno: hace idempotente el handoff (tag/nota una sola vez)
    nombreConfirmado: e.nombreConfirmado, // evita re-escribir ia__nombre si no cambió
    intentos: 0, // el cliente escribió: el contador de seguimientos se reinicia
  })

  return {
    actuo: habla,
    decision,
    nota: [`${habla ? decision.accion : 'callar'}: ${decision.motivo}`, ...notasCrm].join(' · '),
  }
}

export async function esNuestro(messageId?: string): Promise<boolean> {
  if (!messageId) return false
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agente_mensajes_enviados')
    .select('message_id')
    .eq('message_id', messageId)
    .maybeSingle()
  if (error) console.error('esNuestro error:', error.message)
  return Boolean(data)
}

export async function registrarEnviado(messageId: string, conversationId: string, contactId: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('agente_mensajes_enviados')
    .insert({ message_id: messageId, conversation_id: conversationId, contact_id: contactId })
  if (error) console.error('registrarEnviado error:', error.message)
}
