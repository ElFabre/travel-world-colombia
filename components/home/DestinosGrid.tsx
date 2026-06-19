'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { SectionTag } from '@/components/ui/SectionTag'
import { destinoCardImg } from '@/lib/hero'

interface DestinosGridProps {
  destinos: Destino[]
}

const INICIAL = 3
const PASO = 3

export function DestinosGrid({ destinos }: DestinosGridProps) {
  // Destacados primero, luego el resto.
  const ordenados = [...destinos].sort((a, b) => Number(b.destacado) - Number(a.destacado))
  const [visibles, setVisibles] = useState(INICIAL)

  const lista = ordenados.slice(0, visibles)
  const hayMas = visibles < ordenados.length

  return (
    <section aria-labelledby="destinos-title" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <SectionTag className="mb-3">Nuestros destinos</SectionTag>
          <h2
            id="destinos-title"
            className="font-plus-jakarta text-3xl font-bold leading-tight sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Explora el mundo con nosotros
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl font-inter text-sm leading-relaxed"
            style={{ color: 'var(--text-dim)' }}
          >
            Paquetes diseñados para cada tipo de viajero, con atención personalizada desde Fusagasugá.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((d, i) => (
            <li key={d.id} className={i >= INICIAL ? 'destino-fade-in' : undefined}>
              <Link
                href={`/destinos/${d.slug}`}
                className="destino-card group relative flex flex-col overflow-hidden rounded-lg"
              >
                {/* Imagen — sincronizada con el hero (preview local) */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={destinoCardImg(d)}
                    alt={d.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(6,14,26,0.8) 0%, transparent 60%)',
                    }}
                  />
                  {d.precio_desde && (
                    <span
                      className="absolute bottom-3 left-3 font-plus-jakarta text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-sm"
                      style={{ background: 'var(--orange)', color: '#fff' }}
                    >
                      {d.precio_desde}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-plus-jakarta text-base font-bold leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {d.nombre}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <span
                      className="flex items-center gap-1 font-inter text-xs"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      <MapPin size={12} />
                      {d.pais}
                    </span>
                    {d.duracion && (
                      <span
                        className="flex items-center gap-1 font-inter text-xs"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        <Clock size={12} />
                        {d.duracion}
                      </span>
                    )}
                  </div>

                  {d.descripcion && (
                    <p
                      className="line-clamp-2 font-inter text-xs leading-relaxed"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {d.descripcion}
                    </p>
                  )}

                  <span
                    className="mt-1 font-plus-jakarta text-[10px] font-bold tracking-[0.12em] uppercase"
                    style={{ color: 'var(--orange)' }}
                  >
                    Ver detalles →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {hayMas && (
            <button
              type="button"
              onClick={() => setVisibles(v => Math.min(v + PASO, ordenados.length))}
              className="destinos-cargar-mas font-plus-jakarta text-[11px] font-bold tracking-[0.15em] uppercase px-6 py-3 rounded-sm"
            >
              Cargar más
            </button>
          )}
          <Link
            href="/destinos"
            className="destinos-ver-todos font-plus-jakarta text-[11px] font-bold tracking-[0.15em] uppercase px-6 py-3 rounded-sm border inline-block"
          >
            Ver todos los destinos
          </Link>
        </div>
      </div>
    </section>
  )
}
