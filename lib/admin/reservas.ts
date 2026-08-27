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
  /** id real del campo de oportunidad en GHL (resuelto por nombre). */
  ghlId: string
  /** id del campo de CONTACTO del que se prefillea, si aplica. */
  prefillContactId?: string
}

/** Orden de pasos del wizard = orden de aparición de las carpetas en el catálogo. */
export function carpetasDelCatalogo(): string[] {
  const vistas: string[] = []
  for (const c of catalogoCrudo as CampoCatalogo[]) {
    if (!vistas.includes(c.folder)) vistas.push(c.folder)
  }
  return vistas
}

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
    const real = oportunidadPorNombre.get(c.name.trim())
    if (!real) {
      sinResolver.push(c.name)
      continue
    }
    const fuente = c.sourceContactKey ? contactoPorKey.get(c.sourceContactKey) : undefined
    campos.push({
      ...c,
      // Las opciones reales de GHL mandan sobre las del catálogo (por si se
      // editaron en la UI después de crearlas).
      options: real.picklistOptions?.length ? real.picklistOptions : c.options,
      ghlId: real.id,
      prefillContactId: fuente?.id,
    })
  }

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
