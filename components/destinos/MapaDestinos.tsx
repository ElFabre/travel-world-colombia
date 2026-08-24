'use client'

import { useMemo, useState } from 'react'

/**
 * Mapamundi interactivo de /destinos, estilo "mapa de puntos".
 *
 * Cada continente se dibuja como una retícula de puntos (equirectangular
 * estilizada, 72×30 celdas) definida por rangos [fila, colInicio, colFin] —
 * mucho más fácil de ajustar que paths bézier. Las regiones CON programas se
 * iluminan y llevan una pastilla con su conteo; las vacías quedan tenues y
 * decorativas. Colombia (nacional) tiene su propio pin.
 *
 * El mapa no filtra por sí mismo: reporta la selección al padre
 * (DestinosExplorador) vía onSelect, y pinta el estado `seleccion`.
 */

export type SeleccionMapa = string | 'nacional' | null

interface MapaDestinosProps {
  /** Conteo de programas por región (solo internacionales). */
  regiones: Map<string, number>
  /** Conteo de programas nacionales (pin de Colombia). */
  nacionales: number
  /** Región seleccionada ('nacional' para Colombia) o null. */
  seleccion: SeleccionMapa
  onSelect: (sel: SeleccionMapa) => void
}

const CELDA = 13
const R_PUNTO = 3.1

/** Retícula por región: [fila, colInicio, colFin] (72 columnas × 30 filas). */
const RANGOS: Record<string, [number, number, number][]> = {
  N: [
    [3, 26, 29],
    [4, 4, 7], [4, 9, 24], [4, 27, 30],
    [5, 5, 7], [5, 9, 24], [5, 27, 30],
    [6, 8, 25], [6, 28, 29],
    [7, 9, 24],
    [8, 10, 24],
    [9, 12, 23],
    [10, 12, 23],
    [11, 13, 22],
    [12, 13, 21],
    [13, 14, 19],
    [14, 15, 18],
  ],
  C: [[15, 17, 20], [16, 18, 20]],
  K: [[14, 21, 23], [15, 22, 25]],
  S: [
    [16, 21, 24], [17, 20, 26], [18, 20, 28], [19, 21, 29], [20, 21, 28],
    [21, 21, 27], [22, 21, 26], [23, 21, 25], [24, 21, 24], [25, 21, 23],
    [26, 21, 22], [27, 21, 22], [28, 21, 22],
  ],
  E: [
    [4, 37, 40], [5, 36, 41], [6, 35, 42], [7, 34, 43], [8, 34, 44],
    [9, 34, 44], [10, 34, 42],
  ],
  F: [
    [11, 34, 40], [12, 34, 44], [13, 34, 44], [14, 34, 44], [15, 34, 45],
    [16, 35, 45], [17, 36, 45], [18, 37, 45], [19, 38, 45], [20, 38, 44],
    [21, 38, 44], [21, 46, 46], [22, 38, 43], [22, 46, 46], [23, 38, 42],
    [24, 38, 41], [25, 39, 40],
  ],
  A: [
    [3, 50, 64], [4, 46, 66], [5, 44, 68], [6, 44, 68], [7, 44, 67],
    [8, 45, 66], [9, 45, 64], [10, 45, 62], [10, 64, 64], [11, 45, 61],
    [11, 64, 64], [12, 45, 60], [13, 45, 59], [14, 45, 48], [14, 50, 53],
    [14, 56, 58], [15, 50, 53], [15, 56, 59], [16, 51, 52], [16, 56, 60],
    [17, 52, 52], [17, 56, 59], [18, 57, 63], [19, 58, 64],
  ],
  O: [
    [19, 65, 67], [20, 64, 66], [21, 61, 65], [22, 60, 66], [23, 60, 66],
    [24, 60, 65], [25, 61, 64], [26, 69, 70], [27, 69, 70],
  ],
}

/** Nombre visible (== valor de `region` en la BD) y posición de la pastilla. */
const META: Record<string, { nombre: string; pill: [number, number] }> = {
  N: { nombre: 'Norteamérica', pill: [150, 70] },
  C: { nombre: 'Centroamérica', pill: [52, 224] },
  K: { nombre: 'Caribe', pill: [352, 186] },
  S: { nombre: 'Suramérica', pill: [360, 310] },
  E: { nombre: 'Europa', pill: [470, 42] },
  F: { nombre: 'África', pill: [560, 300] },
  A: { nombre: 'Asia', pill: [700, 84] },
  O: { nombre: 'Oceanía', pill: [790, 372] },
}

const cx = (col: number) => col * CELDA + 8
const cy = (fila: number) => fila * CELDA + 8

/** Pin de Colombia (celda aproximada de Colombia en la retícula). */
const COLOMBIA: [number, number] = [cx(21), cy(17)]

function Pill({
  x, y, texto, activo, tenue,
}: { x: number; y: number; texto: string; activo: boolean; tenue?: boolean }) {
  const w = texto.length * 6.6 + 20
  return (
    <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
      <rect
        width={w}
        height={22}
        rx={11}
        fill={activo ? 'var(--orange)' : 'rgba(255,255,255,0.08)'}
        stroke={activo ? 'var(--orange)' : 'rgba(255,255,255,0.18)'}
      />
      <text
        x={w / 2}
        y={15}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill={activo ? 'var(--orange-contrast)' : tenue ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)'}
        style={{ fontFamily: 'var(--font-inter, Inter), sans-serif' }}
      >
        {texto}
      </text>
    </g>
  )
}

export function MapaDestinos({ regiones, nacionales, seleccion, onSelect }: MapaDestinosProps) {
  const [hover, setHover] = useState<string | null>(null)

  // Puntos por región, calculados una vez.
  const puntos = useMemo(() => {
    const porRegion = new Map<string, [number, number][]>()
    for (const [letra, rangos] of Object.entries(RANGOS)) {
      const pts: [number, number][] = []
      for (const [fila, c1, c2] of rangos) {
        for (let c = c1; c <= c2; c++) pts.push([cx(c), cy(fila)])
      }
      porRegion.set(letra, pts)
    }
    return porRegion
  }, [])

  const toggle = (sel: SeleccionMapa) => onSelect(seleccion === sel ? null : sel)

  const nacionalActivo = seleccion === 'nacional'

  return (
    <div
      className="tema-oscuro relative overflow-hidden rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <p className="mb-1 px-2 font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        Explora por región
      </p>
      <p className="mb-3 px-2 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
        Haz clic en una región del mapa para ver sus destinos.
      </p>

      <svg viewBox="0 24 952 372" className="h-auto w-full" role="group" aria-label="Mapa de regiones con destinos">
        {Object.entries(META).map(([letra, meta]) => {
          const n = regiones.get(meta.nombre) ?? 0
          const conDatos = n > 0
          const activo = seleccion === meta.nombre
          const enHover = hover === letra

          const fill = activo
            ? 'var(--orange)'
            : enHover && conDatos
              ? 'color-mix(in srgb, var(--orange) 65%, #fff)'
              : conDatos
                ? 'rgba(255,255,255,0.34)'
                : 'rgba(255,255,255,0.10)'

          return (
            <g
              key={letra}
              role={conDatos ? 'button' : undefined}
              tabIndex={conDatos ? 0 : undefined}
              aria-pressed={conDatos ? activo : undefined}
              aria-label={conDatos ? `${meta.nombre}: ${n} programa${n !== 1 ? 's' : ''}` : undefined}
              onClick={conDatos ? () => toggle(meta.nombre) : undefined}
              onKeyDown={conDatos ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(meta.nombre) } } : undefined}
              onMouseEnter={conDatos ? () => setHover(letra) : undefined}
              onMouseLeave={conDatos ? () => setHover(null) : undefined}
              style={{ cursor: conDatos ? 'pointer' : 'default', outline: 'none', transition: 'opacity .2s' }}
            >
              {puntos.get(letra)!.map(([x, y], i) => (
                <g key={i}>
                  {/* zona de clic más amplia que el punto visible */}
                  {conDatos && <circle cx={x} cy={y} r={7} fill="transparent" />}
                  <circle cx={x} cy={y} r={R_PUNTO} fill={fill} style={{ transition: 'fill .2s' }} />
                </g>
              ))}
              <Pill
                x={meta.pill[0]}
                y={meta.pill[1]}
                texto={conDatos ? `${meta.nombre} · ${n}` : meta.nombre}
                activo={activo || (enHover && conDatos)}
                tenue={!conDatos}
              />
            </g>
          )
        })}

        {/* Colombia — viajes nacionales */}
        {nacionales > 0 && (
          <g
            role="button"
            tabIndex={0}
            aria-pressed={nacionalActivo}
            aria-label={`Colombia: ${nacionales} programas nacionales`}
            onClick={() => toggle('nacional')}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('nacional') } }}
            onMouseEnter={() => setHover('CO')}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <circle cx={COLOMBIA[0]} cy={COLOMBIA[1]} r={16} fill="transparent" />
            <circle cx={COLOMBIA[0]} cy={COLOMBIA[1]} r={9} fill="color-mix(in srgb, var(--orange) 25%, transparent)">
              <animate attributeName="r" values="7;11;7" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={COLOMBIA[0]}
              cy={COLOMBIA[1]}
              r={4.5}
              fill={nacionalActivo || hover === 'CO' ? 'var(--orange)' : '#FFD84D'}
              stroke="rgba(0,0,0,0.35)"
            />
            <Pill
              x={COLOMBIA[0] - 150}
              y={COLOMBIA[1] + 14}
              texto={`Colombia · ${nacionales}`}
              activo={nacionalActivo || hover === 'CO'}
            />
          </g>
        )}
      </svg>
    </div>
  )
}
