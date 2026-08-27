'use server'

import { requireReservas } from '@/lib/admin/guard'
import { registrarActividad } from '@/lib/admin/audit'
import {
  buscarContactos,
  oportunidadesDe,
  obtenerOportunidad,
  obtenerContacto,
  actualizarCampos,
  actualizarCamposOportunidad,
  listarPipelines,
} from '@/lib/agente/ghl'
import {
  catalogoResuelto,
  normalizarValor,
  valorParaGhl,
  ESPEJO_CONTACTO_TRANSICION,
  type CampoReserva,
  type ValorCampo,
} from '@/lib/admin/reservas'

export interface ClienteEncontrado {
  id: string
  nombre: string
  telefono?: string
  email?: string
}

/** Busca clientes en GHL por nombre, teléfono o correo. */
export async function buscarClientes(q: string): Promise<ClienteEncontrado[]> {
  await requireReservas()
  const texto = q.trim()
  if (texto.length < 3) return []
  const contactos = await buscarContactos(texto, 10)
  return contactos.map(c => ({
    id: c.id,
    nombre: [c.firstName, c.lastName].filter(Boolean).join(' ') || '(sin nombre)',
    telefono: c.phone ?? undefined,
    email: c.email ?? undefined,
  }))
}

export interface OportunidadListada {
  id: string
  nombre: string
  pipeline: string
  etapa: string
  status?: string
}

/** Oportunidades del cliente, con nombres de pipeline/etapa legibles. */
export async function listarOportunidades(contactId: string): Promise<OportunidadListada[]> {
  await requireReservas()
  const [oportunidades, pipelines] = await Promise.all([
    oportunidadesDe(contactId),
    listarPipelines(),
  ])
  const porId = new Map(pipelines.map(p => [p.id, p]))
  return oportunidades.map(o => {
    const p = o.pipelineId ? porId.get(o.pipelineId) : undefined
    const etapa = p?.stages?.find(s => s.id === o.pipelineStageId)
    return {
      id: o.id,
      nombre: o.name ?? '(sin nombre)',
      pipeline: p?.name ?? o.pipelineId ?? '¿?',
      etapa: etapa?.name ?? o.pipelineStageId ?? '¿?',
      status: o.status,
    }
  })
}

export interface ReservaCargada {
  oportunidad: { id: string; nombre: string; pipeline: string; etapa: string; status?: string }
  cliente: { id: string; nombre: string; telefono?: string; email?: string }
  campos: CampoReserva[]
  /** Valores ya guardados en la oportunidad, por ghlId. */
  valores: Record<string, ValorCampo>
  /** Prefill desde el contacto (transición), por ghlId — solo donde no hay valor. */
  prefill: Record<string, ValorCampo>
  /** Campos del catálogo que no existen en GHL (no debería pasar; se muestran). */
  sinResolver: string[]
}

/** Carga la oportunidad + catálogo + valores actuales + prefill del contacto. */
export async function cargarReserva(opportunityId: string): Promise<ReservaCargada> {
  await requireReservas()

  const oportunidad = await obtenerOportunidad(opportunityId)
  if (!oportunidad) throw new Error('La oportunidad no existe en GHL.')

  const contactId =
    (oportunidad as { contact?: { id?: string }; contactId?: string }).contactId ??
    (oportunidad as { contact?: { id?: string } }).contact?.id
  const [{ campos, sinResolver }, contacto, pipelines] = await Promise.all([
    catalogoResuelto(),
    contactId ? obtenerContacto(contactId) : Promise.resolve(null),
    listarPipelines(),
  ])

  // Valores actuales de la oportunidad (el GET devuelve varias formas).
  const valores: Record<string, ValorCampo> = {}
  for (const cf of oportunidad.customFields ?? []) {
    const campo = campos.find(c => c.ghlId === cf.id && c.model === 'opportunity')
    if (!campo) continue
    const crudo = cf.fieldValue ?? cf.field_value ?? cf.fieldValueString ?? cf.fieldValueDate
    const v = normalizarValor(crudo, campo.dataType)
    if (v !== null) valores[campo.ghlId] = v
  }

  const contactoPorId = new Map((contacto?.customFields ?? []).map(f => [f.id, f.value]))

  // Los campos que VIVEN en el contacto (facturación estable) leen de ahí.
  for (const campo of campos) {
    if (campo.model !== 'contact') continue
    const v = normalizarValor(contactoPorId.get(campo.ghlId), campo.dataType)
    if (v !== null) valores[campo.ghlId] = v
  }

  // Prefill: el valor que ya vive en el CONTACTO (campos viejos / calificación
  // de Sol), solo para campos aún vacíos en la oportunidad.
  const prefill: Record<string, ValorCampo> = {}
  for (const campo of campos) {
    if (!campo.prefillContactId || valores[campo.ghlId] !== undefined) continue
    const v = normalizarValor(contactoPorId.get(campo.prefillContactId), campo.dataType)
    if (v !== null) prefill[campo.ghlId] = v
  }

  const p = pipelines.find(x => x.id === oportunidad.pipelineId)
  const etapa = p?.stages?.find(s => s.id === oportunidad.pipelineStageId)

  return {
    oportunidad: {
      id: oportunidad.id,
      nombre: oportunidad.name ?? '(sin nombre)',
      pipeline: p?.name ?? '¿?',
      etapa: etapa?.name ?? '¿?',
      status: oportunidad.status,
    },
    cliente: {
      id: contacto?.id ?? contactId ?? '',
      nombre: [contacto?.firstName, contacto?.lastName].filter(Boolean).join(' ') || '(sin nombre)',
      telefono: contacto?.phone ?? undefined,
      email: contacto?.email ?? undefined,
    },
    campos,
    valores,
    prefill,
    sinResolver,
  }
}

/**
 * Guarda un lote de valores (típicamente un paso del wizard). Cada valor va a
 * donde su campo vive (oportunidad o contacto) y, mientras dure la transición
 * del contrato, los de oportunidad se ESPEJAN también al campo viejo del
 * contacto (ver ESPEJO_CONTACTO_TRANSICION) para que la plantilla actual
 * (merge tags `{{contact.*}}`) imprima todo. GHL hace merge en ambos PUT.
 */
export type ResultadoGuardado =
  | { ok: true; guardados: number }
  | { ok: false; error: string }

export async function guardarReserva(
  opportunityId: string,
  valores: Record<string, ValorCampo>
): Promise<ResultadoGuardado> {
  // El error se devuelve como dato, no se lanza: Next.js enmascara los errores
  // lanzados en producción ("omitted in production builds") y el representante
  // se quedaba sin saber POR QUÉ no guardó.
  try {
    return { ok: true, guardados: await guardar(opportunityId, valores) }
  } catch (e) {
    console.error('guardarReserva:', e)
    return { ok: false, error: (e as Error).message }
  }
}

async function guardar(
  opportunityId: string,
  valores: Record<string, ValorCampo>
): Promise<number> {
  const { user } = await requireReservas()

  // El contacto dueño se deriva EN EL SERVIDOR de la oportunidad: el cliente
  // no puede apuntar los campos de contacto a otra persona.
  const oportunidad = await obtenerOportunidad(opportunityId)
  if (!oportunidad) throw new Error('La oportunidad no existe en GHL.')
  const contactId =
    (oportunidad as { contactId?: string }).contactId ??
    (oportunidad as { contact?: { id?: string } }).contact?.id

  const { campos } = await catalogoResuelto()
  const porId = new Map(campos.map(c => [c.ghlId, c]))

  const loteOportunidad: { id: string; field_value: string | number | string[] }[] = []
  const loteContacto = new Map<string, string | number | string[]>()

  for (const [ghlId, valor] of Object.entries(valores)) {
    const campo = porId.get(ghlId)
    if (!campo) continue // solo campos del catálogo: nada de escribir ids arbitrarios
    if (valor === '' || (Array.isArray(valor) && valor.length === 0)) continue
    const v = valorParaGhl(valor, campo.dataType)

    if (campo.model === 'contact') {
      loteContacto.set(ghlId, v)
    } else {
      loteOportunidad.push({ id: ghlId, field_value: v })
      if (ESPEJO_CONTACTO_TRANSICION) {
        if (campo.prefillContactId) loteContacto.set(campo.prefillContactId, v)
        // Duplicados viejos que la plantilla imprime (variantes TEXT): se
        // escriben como texto para no pelear con su tipo.
        for (const extra of campo.espejoExtraIds ?? []) {
          loteContacto.set(extra, Array.isArray(v) ? v : String(v))
        }
      }
    }
  }

  const total = loteOportunidad.length + loteContacto.size
  if (total === 0) return 0

  if (loteOportunidad.length > 0) {
    await actualizarCamposOportunidad(opportunityId, loteOportunidad)
  }
  if (loteContacto.size > 0 && contactId) {
    await actualizarCampos(
      contactId,
      [...loteContacto.entries()].map(([id, field_value]) => ({ id, field_value }))
    )
  }

  await registrarActividad({
    email: user.email!,
    accion: 'guardar-reserva',
    nombre: opportunityId,
    detalle: { oportunidad: loteOportunidad.length, contacto: loteContacto.size },
  })

  return loteOportunidad.length
}
