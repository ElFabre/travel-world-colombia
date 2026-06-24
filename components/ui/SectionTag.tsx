import type { ReactNode } from 'react'

interface SectionTagProps {
  children: ReactNode
  className?: string
}

/** Etiqueta de sección — naranja · Cinzel · letter-spacing 0.3em · UPPERCASE */
export function SectionTag({ children, className = '' }: SectionTagProps) {
  return (
    <p
      className={`font-cinzel text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm ${className}`}
      style={{ color: 'var(--eyebrow)' }}
    >
      {children}
    </p>
  )
}
