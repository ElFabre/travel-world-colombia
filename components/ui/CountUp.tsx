'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cuenta de 0 al valor cuando entra en pantalla. Respeta prefers-reduced-motion
 * (muestra el valor final sin animar).
 */
export function CountUp({
  to,
  prefix = '',
  suffix = '',
  duration = 1400,
}: {
  to: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVal(to); return }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(to * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return <span ref={ref}>{prefix}{val.toLocaleString('es-CO')}{suffix}</span>
}
