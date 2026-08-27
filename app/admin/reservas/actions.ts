'use server'

import { requireReservas } from '@/lib/admin/guard'
import { registrarActividad } from '@/lib/admin/audit'
import {
  buscarContactos,
  oportunidadesDe,
  obtenerOportunidad,
  obtenerContacto,
  actualizarCamposOportunidad,
  listarPipelines,
} from '@/lib/agente/ghl'
import {
  catalogoResuelto,
  normalizarValor,
  valorParaGhl,
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
    const campo = campos.find(c => c.ghlId === cf.id)
    if (!campo) continue
    const crudo = cf.fieldValue ?? cf.field_value ?? cf.fieldValueString ?? cf.fieldValueDate
    const v = normalizarValor(crudo, campo.dataType)
    if (v !== null) valores[campo.ghlId] = v
  }

  // Prefill: el valor que ya vive en el CONTACTO (campos viejos / calificación
  // de Sol), solo para campos aún vacíos en la oportunidad.
  const prefill: Record<string, ValorCampo> = {}
  if (contacto?.customFields?.length) {
    const contactoPorId = new Map(contacto.customFields.map(f => [f.id, f.value]))
    for (const campo of campos) {
      if (!campo.prefillContactId || valores[campo.ghlId] !== undefined) continue
      const v = normalizarValor(contactoPorId.get(campo.prefillContactId), campo.dataType)
      if (v !== null) prefill[campo.ghlId] = v
    }
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
 * Guarda un lote de valores (típicamente un paso del wizard) en la
 * oportunidad. GHL hace merge: solo pisa lo que va en el arreglo.
 */
export async function guardarReserva(
  opportunityId: string,
  valores: Record<string, ValorCampo>
): Promise<{ guardados: number }> {
  const { user } = await requireReservas()

  const { campos } = await catalogoResuelto()
  const porId = new Map(campos.map(c => [c.ghlId, c]))

  const lote: { id: string; field_value: string | number | string[] }[] = []
  for (const [ghlId, valor] of Object.entries(valores)) {
    const campo = porId.get(ghlId)
    if (!campo) continue // solo campos del catálogo: nada de escribir ids arbitrarios
    if (valor === '' || (Array.isArray(valor) && valor.length === 0)) continue
    lote.push({ id: ghlId, field_value: valorParaGhl(valor, campo.dataType) })
  }
  if (lote.length === 0) return { guardados: 0 }

  await actualizarCamposOportunidad(opportunityId, lote)

  await registrarActividad({
    email: user.email!,
    accion: 'guardar-reserva',
    nombre: opportunityId,
    detalle: { campos: lote.length },
  })

  return { guardados: lote.length }
}
