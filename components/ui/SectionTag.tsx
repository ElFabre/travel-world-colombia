import type { ReactNode } from 'react'

interface SectionTagProps {
  children: ReactNode
  className?: string
}

/** Etiqueta de sección — naranja · Cinzel · 9px · letter-spacing 0.4em · UPPERCASE */
export function SectionTag({ children, className = '' }: SectionTagProps) {
  return (
    <p
      className={`font-cinzel text-[9px] tracking-[0.4em] uppercase text-orange ${className}`}
    >
      {children}
    </p>
  )
}
