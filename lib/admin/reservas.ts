import catalogoCrudo from '@/scripts/ghl-campos-oportunidad.catalog.json'
import {
  listarCamposTodosLosModelos,
  type CampoPersonalizadoGhl,
} from '@/lib/agente/ghl'

/**
 * La sección Reservas del panel: un wizard que llena los ~161 campos
 * personalizados de OPORTUNIDAD creados por la migración (ver
 * docs/migracion-campos-oportunidad.md).
 *
 * El esquema del formulario NO se dibuja a mano: se genera desde el catálogo
 * `scripts/ghl-campos-oportunidad.catalog.json` — la misma fuente con la que
 * el script de la Fase 1 creó los campos en GHL. Carpeta = paso del wizard,
 * dataType = tipo de input, sourceContactKey = de dónde prefillear durante la
 * transición (calificación de Sol / campos viejos del contacto).
 */

export interface CampoCatalogo {
  folder: string
  name: string
  dataType: string
  sourceContactKey?: string | null
  options?: string[]
  note?: string
}

export interface CampoReserva extends CampoCatalogo {
  /** id real del campo en GHL (resuelto por nombre o fieldKey). */
  ghlId: string
  /** En qué registro vive el campo. Casi todos en la oportunidad; los datos
   *  estables de facturación se quedan en el contacto (diseño §4b). */
  model: 'opportunity' | 'contact'
  /** id del campo de CONTACTO del que se prefillea (y al que se ESPEJA), si aplica. */
  prefillContactId?: string
  /**
   * ¿El contrato imprime este campo? Los que tienen origen en contacto son
   * los 128 merge tags de la plantilla; los del catálogo TMS (sin origen) son
   * operativos y el wizard los pliega para que el formulario calque el
   * documento y no confunda al representante.
   */
  enContrato: boolean
}

/**
 * ESPEJO TRANSICIONAL: mientras la plantilla del contrato siga imprimiendo
 * merge tags `{{contact.*}}` (la v2 con `{{opportunity.*}}` está EN PAUSA),
 * cada guardado escribe el valor TAMBIÉN en el campo viejo del contacto
 * (vía `sourceContactKey`). Así el contrato de hoy sale completo sin
 * re-digitar nada. Apagar (false) cuando la plantilla v2 entre en uso —
 * es la única excepción viva a la regla "no escribir campos viejos".
 */
export const ESPEJO_CONTACTO_TRANSICION = true

/**
 * Campos que viven SOLO en el contacto y el contrato también imprime: los
 * datos estables de facturación (carpeta 📋Datos de Facturación). No migran
 * a oportunidad por diseño; el wizard los muestra en el paso Facturación.
 */
const FACTURACION_CONTACTO_KEYS = [
  'contact.cliente', //                         Cliente Nombre Completo
  'contact.numero_de_documento', //             Numero de NIT
  'contact.direccin', //                        Dirección
  'contact.datos_de_facturacin__ciudad', //     Ciudad
  'contact.datos_de_facturacin__correo_electrnico', // Correo Electrónico
  'contact.telefono', //                        Teléfono
]

/**
 * Orden de pasos del wizard, pedido por el usuario (2026-08-27) calcando el
 * orden de las carpetas de contacto que el equipo ya conoce. Dos ajustes
 * sobre las carpetas del catálogo: Liquidación se parte en Vuelos y Porción
 * Terrestre, y "ENVIAR CONTRATO?" se va a un paso final propio — disparar el
 * contrato es lo último, cuando ya todo está lleno.
 */
const ORDEN_PASOS = [
  'Contrato',
  'Facturacion',
  'Generales del Viaje',
  'Vuelos',
  'Pasajeros',
  'Liquidación Vuelos',
  'Liquidación Porción Terrestre',
  'Plan de Pagos',
  'Inclusiones',
  'Enviar Contrato',
]

/** Reubica un campo del catálogo en su paso del wizard. */
function pasoDe(c: CampoCatalogo): string {
  if (c.name === 'ENVIAR CONTRATO?') return 'Enviar Contrato'
  // El contrato imprime estos dos en el recuadro "Generales del Viaje",
  // aunque el catálogo los dejó en la carpeta Contrato.
  if (c.name === 'Acomodacion' || c.name === 'Cantidad de Habitaciones') {
    return 'Generales del Viaje'
  }
  // El destino sale en el ENCABEZADO del contrato, junto al número y el tipo:
  // se pide en el paso Contrato (viene del viejo contact.c__destino). El
  // nombre GHL no se toca — el catálogo TMS lo busca por nombre exacto.
  if (c.name === 'Destino de interés') return 'Contrato'
  if (c.folder === 'Liquidacion') {
    return c.name.includes('Vuelos') ? 'Liquidación Vuelos' : 'Liquidación Porción Terrestre'
  }
  return c.folder
}

/**
 * Campos que el wizard NO muestra (pedido del usuario 2026-08-27): el grupo
 * TRM es una tasa de cambio, no una fila de pasajeros — cantidad/valor plan/
 * valor total ahí no significan nada. Los campos siguen existiendo en GHL
 * (vacíos); si algún día hacen falta, se quitan de esta lista.
 */
const CAMPOS_OCULTOS = new Set(['TRM - Cantidad', 'TRM - Valor Plan', 'TRM - Valor Total'])

/**
 * Orden de los campos de Generales del Viaje calcando el recuadro del
 * contrato (fecha ida/regreso, noches, personas, habitaciones, acomodación,
 * plan, hotel…). Lo que no esté aquí conserva su orden del catálogo.
 */
const ORDEN_GENERALES = [
  'Fecha confirmada de salida',
  'Fecha confirmada de regreso',
  'Numero de noches',
  'Pax total',
  'Cantidad de Habitaciones',
  'Acomodacion',
  'Tipo de paquete',
  'Hotel o producto',
  'Peticiones especiales',
]

/**
 * Orden de las columnas del "Registro de Pagos" tal como las imprime el
 * contrato: TRM, fecha, medio, total, abono, saldo. Tipo de Pago (solo existe
 * en Pago 1 y el contrato no lo tabula) va al final.
 */
const ORDEN_PAGO = [
  'TRM',
  'Fecha de Pago',
  'Medio de Pago',
  'Total Plan',
  'Abono',
  'Saldo en Pesos',
  'Tipo de Pago',
]

// Los campos de la subcuenta cambian poco: cache en memoria del proceso con
// TTL corto. Si el proceso es nuevo (serverless frío) simplemente se re-pide.
let cacheCampos: { campos: CampoPersonalizadoGhl[]; vence: number } | null = null

async function camposGhl(): Promise<CampoPersonalizadoGhl[]> {
  if (cacheCampos && Date.now() < cacheCampos.vence) return cacheCampos.campos
  const campos = await listarCamposTodosLosModelos()
  cacheCampos = { campos, vence: Date.now() + 10 * 60_000 }
  return campos
}

/**
 * Catálogo resuelto contra GHL: cada campo del catálogo con su id real de
 * oportunidad (match por nombre — los campos se CREARON desde este catálogo,
 * así que el nombre es la llave natural) y el id del campo de contacto fuente
 * para el prefill (match por fieldKey).
 */
export async function catalogoResuelto(): Promise<{
  campos: CampoReserva[]
  sinResolver: string[]
}> {
  const ghl = await camposGhl()

  const oportunidadPorNombre = new Map<string, CampoPersonalizadoGhl>()
  const contactoPorKey = new Map<string, CampoPersonalizadoGhl>()
  for (const c of ghl) {
    if (c.model === 'opportunity' && c.name) oportunidadPorNombre.set(c.name.trim(), c)
    if (c.model !== 'opportunity' && c.fieldKey) contactoPorKey.set(c.fieldKey, c)
  }

  const campos: CampoReserva[] = []
  const sinResolver: string[] = []

  for (const c of catalogoCrudo as CampoCatalogo[]) {
    if (CAMPOS_OCULTOS.has(c.name)) continue
    const real = oportunidadPorNombre.get(c.name.trim())
    if (!real) {
      sinResolver.push(c.name)
      continue
    }
    const fuente = c.sourceContactKey ? contactoPorKey.get(c.sourceContactKey) : undefined
    campos.push({
      ...c,
      folder: pasoDe(c),
      // Las opciones reales de GHL mandan sobre las del catálogo (por si se
      // editaron en la UI después de crearlas).
      options: real.picklistOptions?.length ? real.picklistOptions : c.options,
      ghlId: real.id,
      model: 'opportunity',
      prefillContactId: fuente?.id,
      enContrato: Boolean(c.sourceContactKey),
    })
  }

  // Facturación estable: campos de CONTACTO al final del paso Facturación.
  for (const key of FACTURACION_CONTACTO_KEYS) {
    const real = contactoPorKey.get(key)
    if (!real) {
      sinResolver.push(key)
      continue
    }
    campos.push({
      folder: 'Facturacion',
      name: real.name ?? key,
      dataType: real.dataType ?? 'TEXT',
      options: real.picklistOptions,
      ghlId: real.id,
      model: 'contact',
      enContrato: true, // la factura electrónica del contrato los imprime
    })
  }

  // Orden final: por paso y, dentro de Generales, calcando el contrato.
  const prioridad = (c: CampoReserva) => {
    if (c.folder === 'Generales del Viaje') {
      const i = ORDEN_GENERALES.indexOf(c.name)
      return i === -1 ? ORDEN_GENERALES.length : i
    }
    if (c.folder === 'Plan de Pagos') {
      // El sort es estable: a igual sufijo, Pago 1 < Pago 2 < … se conserva,
      // así que los grupos quedan en orden y cada uno con sus columnas
      // calcando la tabla del contrato.
      const i = ORDEN_PAGO.indexOf(c.name.replace(/^.+? - /, ''))
      return i === -1 ? ORDEN_PAGO.length : i
    }
    return 0
  }
  campos.sort(
    (a, b) =>
      ORDEN_PASOS.indexOf(a.folder) - ORDEN_PASOS.indexOf(b.folder) || prioridad(a) - prioridad(b)
  )

  return { campos, sinResolver }
}

/** Valor de formulario: siempre serializable y simple. */
export type ValorCampo = string | string[]

/**
 * Normaliza el valor crudo que devuelve GHL (GET oportunidad o contacto) al
 * formato del formulario. El GET por id y el search devuelven formas
 * distintas (`fieldValue` vs `fieldValueString`…, fechas a veces epoch ms) —
 * hallazgo documentado en la migración.
 */
export function normalizarValor(crudo: unknown, dataType: string): ValorCampo | null {
  if (crudo === null || crudo === undefined || crudo === '') return null

  if (Array.isArray(crudo)) return crudo.map(String)

  if (dataType === 'DATE') {
    // Puede venir como epoch ms, ISO o YYYY-MM-DD. El input date quiere YYYY-MM-DD.
    if (typeof crudo === 'number') {
      const d = new Date(crudo)
      return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
    }
    const s = String(crudo)
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
    return m ? m[1] : s
  }

  if (typeof crudo === 'object') return null // formas raras: mejor vacío que basura
  return String(crudo)
}

/** Prepara el valor del formulario para el PUT a GHL. */
export function valorParaGhl(valor: ValorCampo, dataType: string): string | number | string[] {
  if (Array.isArray(valor)) return valor
  if (dataType === 'NUMERICAL') {
    const n = Number(valor)
    return Number.isFinite(n) ? n : valor
  }
  return valor
}
