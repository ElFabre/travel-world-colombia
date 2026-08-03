'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Revela su contenido al entrar en pantalla (una sola vez). Costo casi nulo:
 * un IntersectionObserver + transición CSS. Respeta prefers-reduced-motion.
 * Los estilos viven en globals.css ([data-reveal]).
 */
export function Reveal({
  children,
  delay = 0,
  variant = 'up',
  className,
}: {
  children: React.ReactNode
  delay?: number
  variant?: 'up' | 'left' | 'right' | 'zoom'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  // prefers-reduced-motion NO se atiende aquí: globals.css ya fuerza el estado
  // visible ([data-reveal] con opacity 1 !important) en ese modo.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} data-reveal={variant} data-shown={shown} className={className} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
