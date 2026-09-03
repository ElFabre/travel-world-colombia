'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Destino } from '@/types/destino'
import { BackgroundSlider } from './BackgroundSlider'
import { HeroContent } from './HeroContent'
import { ThumbnailBar } from './ThumbnailBar'
import { heroBg, glowColor } from '@/lib/hero'

interface HeroSectionProps {
  destinos: Destino[]
}

export function HeroSection({ destinos }: HeroSectionProps) {
  // Destino activo por defecto: primer destacado, o el primero.
  const defaultIndex = useMemo(() => {
    const i = destinos.findIndex(d => d.destacado)
    return i >= 0 ? i : 0
  }, [destinos])

  const [activeIndex, setActiveIndex] = useState(defaultIndex)

  // Crossfade: dos capas A/B alternando.
  const [layers, setLayers] = useState(() => ({
    a: heroBg(destinos[defaultIndex]),
    b: '',
    showA: true,
  }))

  const select = (i: number) => {
    if (i === activeIndex) return
    const url = heroBg(destinos[i])
    setLayers(prev =>
      prev.showA ? { ...prev, b: url, showA: false } : { ...prev, a: url, showA: true }
    )
    setActiveIndex(i)
  }

  // Auto-loop: avanza al siguiente destino cada 4s (crossfade). Cada
  // selección manual reinicia el temporizador (al depender de activeIndex).
  useEffect(() => {
    if (destinos.length <= 1) return
    const id = setTimeout(() => {
      const next = (activeIndex + 1) % destinos.length
      const url = heroBg(destinos[next])
      setLayers(prev =>
        prev.showA ? { ...prev, b: url, showA: false } : { ...prev, a: url, showA: true }
      )
      setActiveIndex(next)
    }, 4000)
    return () => clearTimeout(id)
  }, [activeIndex, destinos])

  const active = destinos[activeIndex]
  if (!active) return null

  return (
    <section
      aria-label={`Destino destacado: ${active.nombre}`}
      className="tema-oscuro relative flex w-full flex-col overflow-hidden"
      style={{ height: '100svh' }}
    >
      <BackgroundSlider layerA={layers.a} layerB={layers.b} showA={layers.showA} />

      {/* Glow — color según la región del destino */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[26%] z-[2] h-[300px] w-[300px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(${glowColor(active.region)},.25) 0%, transparent 70%)`,
          filter: 'blur(50px)',
          animation: 'pulseGlow 4s ease-in-out infinite alternate',
          transition: 'background 0.8s ease',
        }}
      />

      {/* Contenido — remount por key dispara el fadeUp en cada cambio */}
      <div className="flex flex-1 flex-col justify-center pt-20">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
          <HeroContent key={active.id} destino={active} />
        </div>
      </div>

      <ThumbnailBar destinos={destinos} activeIndex={activeIndex} onSelect={select} />
    </section>
  )
}
