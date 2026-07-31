'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { destinoCardImg } from '@/lib/hero'

interface DestinosListaProps {
  destinos: Destino[]
}

/** Ancla del país en la página (id de sección y target de los chips). */
const anclaPais = (pais: string) =>
  `pais-${pais.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}`

/** Tarjeta de un programa (la misma card azul de siempre). */
function DestinoCard({ d, i }: { d: Destino; i: number }) {
  return (
    <li
      className="animate-fade-up"
      style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationFillMode: 'both' }}
    >
      <Link href={`/destinos/${d.slug}`} className="destino-card u-lift tema-oscuro group flex h-full flex-col overflow-hidden rounded-lg">
        {/* Imagen — sincronizada con el hero (preview local) */}
        <div className="relative h-56 overflow-hidden">
          <Image
            src={destinoCardImg(d)}
            alt={d.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(8, 18, 38,0.85) 0%, transparent 55%)' }}
          />
          {/* Precio */}
          {d.precio_desde && (
            <span
              className="absolute bottom-3 left-3 font-plus-jakarta text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-sm"
              style={{ background: 'var(--orange)', color: 'var(--orange-contrast)' }}
            >
              {d.precio_desde}
            </span>
          )}
          {/* Duración */}
          {d.duracion && (
            <span
              className="absolute bottom-3 right-3 flex items-center gap-1 font-inter text-[11px] backdrop-blur-sm px-2 py-1 rounded"
              style={{ background: 'rgba(8, 18, 38,0.75)', color: 'rgba(255,255,255,0.9)' }}
            >
              <Clock size={10} />
              {d.duracion}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3
            className="font-plus-jakarta text-base font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {d.nombre}
          </h3>

          {d.descripcion && (
            <p
              className="line-clamp-2 font-inter text-base leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {d.descripcion}
            </p>
          )}

          <span
            className="mt-auto flex items-center gap-1 font-plus-jakarta text-[10px] font-bold tracking-[0.12em] uppercase pt-2"
            style={{ color: 'var(--orange)' }}
          >
            Ver destino <ChevronRight size={12} />
          </span>
        </div>
      </Link>
    </li>
  )
}

/**
 * Programas agrupados por país: chips de navegación arriba (saltan a la caja
 * del país) y una caja por país con sus programas adentro. El orden de los
 * países sigue el menor `orden` de sus programas (lo que se define en el panel).
 */
export function DestinosLista({ destinos }: DestinosListaProps) {
  const grupos = useMemo(() => {
    const porPais = new Map<string, Destino[]>()
    for (const d of destinos) {
      const lista = porPais.get(d.pais) ?? []
      lista.push(d)
      porPais.set(d.pais, lista)
    }
    return Array.from(porPais.entries()).sort(
      (a, b) => Math.min(...a[1].map(d => d.orden)) - Math.min(...b[1].map(d => d.orden))
    )
  }, [destinos])

  if (destinos.length === 0) {
    return (
      <p className="py-20 text-center font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
        No hay destinos disponibles por el momento.
      </p>
    )
  }

  return (
    <div>
      {/* Chips: saltan a la caja de cada país */}
      <div className="mb-10 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {grupos.map(([pais, lista]) => (
          <a
            key={pais}
            href={`#${anclaPais(pais)}`}
            className="shrink-0 rounded-full px-5 py-2 font-plus-jakarta text-[11px] font-bold tracking-[0.12em] uppercase transition-all duration-200"
            style={{ background: 'var(--bg-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
          >
            {pais} · {lista.length}
          </a>
        ))}
      </div>

      {/* Una caja por país con sus programas adentro */}
      <div className="flex flex-col gap-10">
        {grupos.map(([pais, lista]) => (
          <section
            key={pais}
            id={anclaPais(pais)}
            className="rounded-2xl p-5 sm:p-8"
            style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', scrollMarginTop: '96px' }}
          >
            <header className="mb-6 flex flex-wrap items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', color: 'var(--orange)' }}
              >
                <MapPin size={18} />
              </span>
              <h2 className="font-plus-jakarta text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                {pais}
              </h2>
              <span
                className="rounded-full px-3 py-1 font-inter text-[11px] font-bold"
                style={{ background: 'color-mix(in srgb, var(--orange) 10%, transparent)', color: 'var(--orange)' }}
              >
                {lista.length} programa{lista.length !== 1 ? 's' : ''}
              </span>
              <div aria-hidden className="hidden h-px flex-1 sm:block" style={{ background: 'var(--border)' }} />
            </header>

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((d, i) => (
                <DestinoCard key={d.id} d={d} i={i} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
