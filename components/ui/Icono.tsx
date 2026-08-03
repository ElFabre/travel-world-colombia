import type { CSSProperties } from 'react'
import { ICONOS } from '@/lib/iconos'

interface Props {
  nombre?: string
  size?: number
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}

/**
 * Dibuja el SVG del icono guardado en el CMS (ej. "plane", "file-check").
 * Si el valor es un emoji o un nombre fuera del catálogo, lo muestra tal cual
 * como texto. El catálogo (`lib/iconos.ts`) es el mismo que alimenta el
 * selector del panel, así que no se puede guardar algo que aquí no exista.
 */
export function Icono({ nombre, size = 24, className, style, strokeWidth = 1.6 }: Props) {
  if (!nombre) return null
  const Cmp = ICONOS[nombre.trim().toLowerCase()]
  if (Cmp) return <Cmp size={size} className={className} style={style} strokeWidth={strokeWidth} />
  return <span className={className} style={style} aria-hidden>{nombre}</span>
}
