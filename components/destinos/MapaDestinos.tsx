'use client'

import { useState } from 'react'
import { MAPA_VIEWBOX, REGION_PATHS, REGION_CENTROIDES, COLOMBIA_XY } from './mapa-mundo'

/**
 * Mapamundi interactivo de /destinos con geografía REAL (Natural Earth 110m,
 * dominio público; ver scripts/generar-mapa-mundo.mjs). Cada región es una
 * silueta clicable: las que tienen programas se iluminan y llevan una pastilla
 * con su conteo; las vacías quedan tenues y decorativas. Colombia (nacional)
 * tiene su propio pin animado.
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

/** Orden de dibujo y ajuste fino de cada pastilla respecto al centroide. */
const REGIONES: { nombre: string; dx: number; dy: number }[] = [
  { nombre: 'Norteamérica', dx: -10, dy: 10 },
  { nombre: 'Centroamérica', dx: -105, dy: 30 },
  { nombre: 'Caribe', dx: 55, dy: -14 },
  { nombre: 'Suramérica', dx: 55, dy: 30 },
  { nombre: 'Europa', dx: -25, dy: -55 },
  { nombre: 'África', dx: -5, dy: 15 },
  { nombre: 'Asia', dx: 30, dy: -5 },
  { nombre: 'Oceanía', dx: 15, dy: 45 },
]

function Pill({
  x, y, texto, activo, tenue, onClick, onHover, onLeave,
}: {
  x: number; y: number; texto: string; activo: boolean; tenue?: boolean
  onClick?: () => void; onHover?: () => void; onLeave?: () => void
}) {
  // El mapa se muestra compacto (max-w-3xl ≈ escala 0.8), así que la pastilla
  // es un poco más grande en unidades SVG para que quede legible en pantalla.
  // Las pastillas con onClick también filtran (mismo gesto que la silueta);
  // sin onClick quedan decorativas y dejan pasar el clic a lo que hay debajo.
  const w = texto.length * 7.4 + 22
  return (
    <g
      transform={`translate(${x - w / 2}, ${y - 13})`}
      style={{ pointerEvents: onClick ? 'auto' : 'none', cursor: onClick ? 'pointer' : undefined }}
      // stopPropagation: la pastilla de Colombia vive dentro del <g> clicable
      // del pin; sin esto el clic haría toggle dos veces y se anularía.
      onClick={onClick ? e => { e.stopPropagation(); onClick() } : undefined}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <rect
        width={w}
        height={26}
        rx={13}
        fill={activo ? 'var(--orange)' : 'rgba(13, 30, 60, 0.72)'}
        stroke={activo ? 'var(--orange)' : 'rgba(255,255,255,0.22)'}
      />
      <text
        x={w / 2}
        y={18}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={activo ? 'var(--orange-contrast)' : tenue ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)'}
        style={{ fontFamily: 'var(--font-inter, Inter), sans-serif' }}
      >
        {texto}
      </text>
    </g>
  )
}

export function MapaDestinos({ regiones, nacionales, seleccion, onSelect }: MapaDestinosProps) {
  const [hover, setHover] = useState<string | null>(null)

  const toggle = (sel: SeleccionMapa) => onSelect(seleccion === sel ? null : sel)
  const nacionalActivo = seleccion === 'nacional'

  return (
    <div
      className="tema-oscuro relative overflow-hidden rounded-2xl p-3 sm:p-5"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <p className="mb-1 px-2 font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        Explora por región
      </p>
      <p className="mb-3 px-2 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
        Haz clic en una región del mapa para ver sus destinos.
      </p>

      <svg viewBox={MAPA_VIEWBOX} className="h-auto w-full" role="group" aria-label="Mapa de regiones con destinos">
        {/* Siluetas (regiones con datos van clicables; el resto decorativo) */}
        {REGIONES.map(({ nombre }) => {
          const d = REGION_PATHS[nombre]
          if (!d) return null
          const n = regiones.get(nombre) ?? 0
          const conDatos = n > 0
          const activo = seleccion === nombre
          const enHover = hover === nombre

          const fill = activo
            ? 'var(--orange)'
            : enHover && conDatos
              ? 'color-mix(in srgb, var(--orange) 55%, #7a92c4)'
              : conDatos
                ? '#33507f'
                : 'rgba(255,255,255,0.07)'

          return (
            <path
              key={nombre}
              d={d}
              fill={fill}
              stroke={activo ? 'color-mix(in srgb, var(--orange) 70%, #000)' : 'rgba(8, 18, 38, 0.9)'}
              strokeWidth={0.7}
              role={conDatos ? 'button' : undefined}
              tabIndex={conDatos ? 0 : undefined}
              aria-pressed={conDatos ? activo : undefined}
              aria-label={conDatos ? `${nombre}: ${n} programa${n !== 1 ? 's' : ''}` : undefined}
              onClick={conDatos ? () => toggle(nombre) : undefined}
              onKeyDown={conDatos ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(nombre) } } : undefined}
              onMouseEnter={conDatos ? () => setHover(nombre) : undefined}
              onMouseLeave={conDatos ? () => setHover(null) : undefined}
              style={{ cursor: conDatos ? 'pointer' : 'default', outline: 'none', transition: 'fill .2s' }}
            />
          )
        })}

        {/* Pastillas (encima de todas las siluetas) */}
        {REGIONES.map(({ nombre, dx, dy }) => {
          if (!REGION_PATHS[nombre]) return null
          const n = regiones.get(nombre) ?? 0
          const conDatos = n > 0
          const [cx, cy] = REGION_CENTROIDES[nombre] ?? [0, 0]
          return (
            <Pill
              key={nombre}
              x={cx + dx}
              y={cy + dy}
              texto={conDatos ? `${nombre} · ${n}` : nombre}
              activo={seleccion === nombre || (hover === nombre && conDatos)}
              tenue={!conDatos}
              onClick={conDatos ? () => toggle(nombre) : undefined}
              onHover={conDatos ? () => setHover(nombre) : undefined}
              onLeave={conDatos ? () => setHover(null) : undefined}
            />
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
            <circle cx={COLOMBIA_XY[0]} cy={COLOMBIA_XY[1]} r={16} fill="transparent" />
            <circle cx={COLOMBIA_XY[0]} cy={COLOMBIA_XY[1]} r={9} fill="color-mix(in srgb, var(--orange) 30%, transparent)">
              <animate attributeName="r" values="7;12;7" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={COLOMBIA_XY[0]}
              cy={COLOMBIA_XY[1]}
              r={4.5}
              fill={nacionalActivo || hover === 'CO' ? 'var(--orange)' : '#FFD84D'}
              stroke="rgba(0,0,0,0.4)"
            />
            <Pill
              x={COLOMBIA_XY[0] - 78}
              y={COLOMBIA_XY[1] + 22}
              texto={`Colombia · ${nacionales}`}
              activo={nacionalActivo || hover === 'CO'}
              onClick={() => toggle('nacional')}
              onHover={() => setHover('CO')}
              onLeave={() => setHover(null)}
            />
          </g>
        )}
      </svg>
    </div>
  )
}
