'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { heroThumb } from '@/lib/hero'

interface ThumbnailBarProps {
  destinos: Destino[]
  activeIndex: number
  onSelect: (index: number) => void
}

/** Barra de thumbnails circulares — scroll horizontal en móvil, con flechas. */
export function ThumbnailBar({ destinos, activeIndex, onSelect }: ThumbnailBarProps) {
  const prev = () => onSelect((activeIndex - 1 + destinos.length) % destinos.length)
  const next = () => onSelect((activeIndex + 1) % destinos.length)

  return (
    <div
      className="relative z-10 flex items-center gap-2.5 px-6 pb-6 pt-4"
      style={{ animation: 'fadeUp 0.9s 1s both' }}
    >
      <button
        type="button"
        onClick={prev}
        aria-label="Destino anterior"
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border transition-all hover:border-orange hover:bg-orange/10 hover:text-orange"
        style={{ borderColor: 'rgba(244,130,31,.4)', color: 'var(--text-dim)' }}
      >
        <ChevronLeft size={14} />
      </button>

      <div className="no-scrollbar flex gap-2.5 overflow-x-auto">
        {destinos.map((d, i) => {
          const active = i === activeIndex
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Ver destino: ${d.nombre}`}
              aria-pressed={active}
              className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full transition-all duration-300"
              style={{
                border: active ? '2.5px solid var(--orange)' : '2.5px solid transparent',
                transform: active ? 'scale(1.12)' : 'scale(1)',
                boxShadow: active ? '0 0 14px rgba(244,130,31,.5)' : 'none',
              }}
            >
              <Image
                src={heroThumb(d)}
                alt={d.nombre}
                width={54}
                height={54}
                className="h-full w-full object-cover"
              />
              {/* Velo oscuro en inactivos */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full transition-colors"
                style={{ background: active ? 'transparent' : 'rgba(0,0,0,.4)' }}
              />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={next}
        aria-label="Destino siguiente"
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border transition-all hover:border-orange hover:bg-orange/10 hover:text-orange"
        style={{ borderColor: 'rgba(244,130,31,.4)', color: 'var(--text-dim)' }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
