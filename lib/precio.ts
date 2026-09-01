import type { Destino } from '@/types/destino'

export type Moneda = 'COP' | 'USD'

const fmtNumero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/** "$1.279.000" (COP) · "USD $1.290" (USD). */
export function formatearPrecio(valor: number, moneda: Moneda): string {
  const n = fmtNumero.format(valor)
  return moneda === 'USD' ? `USD $${n}` : `$${n}`
}

/**
 * Texto plano del precio SIN "Desde" — es lo que se guarda en `precio_desde`
 * al editar desde el panel (columna legado que lee el agente Sol y sirve de
 * fallback/rollback).
 */
export function precioTextoPlano(valor: number, moneda: Moneda, nota?: string | null): string {
  const base = formatearPrecio(valor, moneda)
  return nota ? `${base} · ${nota}` : base
}

/** Antepone "Desde" al texto libre legado solo si no lo trae ya. */
function normalizarLegado(precio: string): string {
  const p = precio.trim()
  if (!/^desde\b/i.test(p)) return `Desde ${p}`
  return p.charAt(0).toUpperCase() + p.slice(1)
}

/**
 * Precio listo para mostrar en la web: estructurado si existe (formateo
 * consistente), si no el texto libre legado. null = no se pinta la etiqueta.
 */
export function precioDesde(
  d: Pick<Destino, 'precio_valor' | 'precio_moneda' | 'precio_nota' | 'precio_desde'>,
  opts: { conNota?: boolean } = {}
): string | null {
  if (d.precio_valor != null && d.precio_moneda) {
    const base = `Desde ${formatearPrecio(d.precio_valor, d.precio_moneda)}`
    return opts.conNota && d.precio_nota ? `${base} · ${d.precio_nota}` : base
  }
  if (d.precio_desde) return normalizarLegado(d.precio_desde)
  return null
}
