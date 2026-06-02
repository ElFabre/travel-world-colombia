import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { SectionTag } from '@/components/ui/SectionTag'

interface DestinosGridProps {
  destinos: Destino[]
}

export function DestinosGrid({ destinos }: DestinosGridProps) {
  const featured = destinos.filter(d => d.destacado).slice(0, 6)
  const list = featured.length >= 3 ? featured : destinos.slice(0, 6)

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
          {list.map(d => (
            <li key={d.id}>
              <Link
                href={`/destinos/${d.slug}`}
                className="destino-card group relative flex flex-col overflow-hidden rounded-lg"
              >
                {/* Imagen */}
                <div className="relative h-52 overflow-hidden">
                  {d.imagen_thumb ? (
                    <Image
                      src={d.imagen_thumb}
                      alt={d.nombre}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: 'var(--blue)' }} />
                  )}
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

        {destinos.length > 6 && (
          <div className="mt-10 text-center">
            <Link
              href="/destinos"
              className="destinos-ver-todos font-plus-jakarta text-[11px] font-bold tracking-[0.15em] uppercase px-6 py-3 rounded-sm border inline-block"
            >
              Ver todos los destinos
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
