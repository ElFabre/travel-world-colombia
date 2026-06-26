'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { SectionTag } from '@/components/ui/SectionTag'
import { destinoCardImg } from '@/lib/hero'

interface DestinosListaProps {
  destinos: Destino[]
}

const TODOS = 'Todos'

export function DestinosLista({ destinos }: DestinosListaProps) {
  const paises = useMemo(() => {
    const set = new Set(destinos.map(d => d.pais))
    return [TODOS, ...Array.from(set).sort()]
  }, [destinos])

  const [filtro, setFiltro] = useState(TODOS)

  const lista = useMemo(
    () => filtro === TODOS ? destinos : destinos.filter(d => d.pais === filtro),
    [destinos, filtro]
  )

  return (
    <div>
      {/* Filtro por país */}
      <div className="mb-10 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {paises.map(pais => (
          <button
            key={pais}
            onClick={() => setFiltro(pais)}
            className="shrink-0 rounded-full px-5 py-2 font-plus-jakarta text-[11px] font-bold tracking-[0.12em] uppercase transition-all duration-200 cursor-pointer"
            style={
              filtro === pais
                ? { background: 'var(--orange)', color: '#fff', boxShadow: '0 4px 16px rgba(244,130,31,0.4)' }
                : { background: 'var(--bg-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)' }
            }
          >
            {pais}
          </button>
        ))}
      </div>

      {/* Contador */}
      <p className="mb-6 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
        {lista.length} destino{lista.length !== 1 ? 's' : ''}
        {filtro !== TODOS && ` en ${filtro}`}
      </p>

      {/* Grid */}
      {lista.length === 0 ? (
        <p className="py-20 text-center font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          No hay destinos disponibles en este filtro.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((d, i) => (
            <li
              key={d.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationFillMode: 'both' }}
            >
              <Link href={`/destinos/${d.slug}`} className="destino-card u-lift tema-oscuro group flex flex-col overflow-hidden rounded-lg">
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
                    style={{ background: 'linear-gradient(to top, rgba(6,14,26,0.85) 0%, transparent 55%)' }}
                  />
                  {/* País badge */}
                  <span
                    className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-3 py-1 font-inter text-[11px] font-medium backdrop-blur-sm"
                    style={{ background: 'rgba(6,14,26,0.7)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <MapPin size={10} />
                    {d.pais}
                  </span>
                  {/* Precio */}
                  {d.precio_desde && (
                    <span
                      className="absolute bottom-3 left-3 font-plus-jakarta text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-sm"
                      style={{ background: 'var(--orange)', color: '#fff' }}
                    >
                      {d.precio_desde}
                    </span>
                  )}
                  {/* Duración */}
                  {d.duracion && (
                    <span
                      className="absolute bottom-3 right-3 flex items-center gap-1 font-inter text-[11px] backdrop-blur-sm px-2 py-1 rounded"
                      style={{ background: 'rgba(6,14,26,0.75)', color: 'rgba(255,255,255,0.9)' }}
                    >
                      <Clock size={10} />
                      {d.duracion}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2
                    className="font-plus-jakarta text-base font-bold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {d.nombre}
                  </h2>

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
          ))}
        </ul>
      )}
    </div>
  )
}
