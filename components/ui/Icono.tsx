import { icons } from 'lucide-react'
import type { CSSProperties, ComponentType } from 'react'

/** Nombres que lucide renombró (la data del CMS usa los antiguos). */
const ALIAS: Record<string, string> = {
  home: 'House',
  palmtree: 'TreePalm',
  waves: 'WavesHorizontal',
  torii: 'Landmark',
  tower: 'Landmark',
}

type IconCmp = ComponentType<{ size?: number; className?: string; style?: CSSProperties; strokeWidth?: number }>

function pascal(n: string): string {
  return n.trim().split(/[-_\s]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

interface Props {
  nombre?: string
  size?: number
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}

/**
 * Dibuja el SVG de lucide a partir del nombre guardado en el CMS
 * (ej. "plane", "file-check", "mountain-snow"). Si el valor es un emoji o un
 * nombre que no existe en lucide, lo muestra tal cual como texto.
 */
export function Icono({ nombre, size = 24, className, style, strokeWidth = 1.6 }: Props) {
  if (!nombre) return null
  const key = ALIAS[nombre.trim().toLowerCase()] ?? pascal(nombre)
  const Cmp = (icons as Record<string, IconCmp>)[key]
  if (Cmp) return <Cmp size={size} className={className} style={style} strokeWidth={strokeWidth} />
  return <span className={className} style={style} aria-hidden>{nombre}</span>
}
