import Image from 'next/image'
import type { ItinerarioDia } from '@/types/destino'

/**
 * Itinerario día a día en filas: foto a la izquierda con la etiqueta del día
 * ("DÍA 03 · 11 NOV") superpuesta, y a la derecha el título con la descripción
 * en texto justificado. En móvil la foto va arriba y el texto debajo. Los días
 * sin foto ocupan todo el ancho con la etiqueta sobre el título. El número de
 * día sale de la posición en el array (como se cargan en el panel); la fecha
 * es opcional (solo salidas con fecha fija).
 */
export function ItinerarioTimeline({ dias }: { dias: ItinerarioDia[] }) {
  return (
    <ol className="flex flex-col gap-12">
      {dias.map((dia, i) => {
        const etiquetaDia = `DÍA ${String(i + 1).padStart(2, '0')}${dia.fecha ? ` · ${dia.fecha}` : ''}`
        const chipDia = (extra = '') => (
          // Isla oscura dentro de la página clara: `tema-oscuro` hace que
          // var(--orange) resuelva al amarillo de marca (como en el mockup).
          <span
            className={`tema-oscuro rounded-md px-3.5 py-2 font-cinzel text-[11px] font-bold uppercase leading-none tracking-[0.18em] ${extra}`}
            style={{
              background: 'var(--navy)',
              color: 'var(--orange)',
              boxShadow: '0 10px 24px -10px rgba(13, 30, 60, 0.55)',
            }}
          >
            {etiquetaDia}
          </span>
        )

        return (
          <li
            key={i}
            className={`destino-reveal ${dia.imagen ? 'grid gap-5 md:grid-cols-[minmax(0,300px)_1fr] md:items-start md:gap-10' : ''}`}
          >
            {/* Foto del día con la etiqueta superpuesta */}
            {dia.imagen && (
              <div className="relative">
                <span className="absolute -top-3.5 left-4 z-10 inline-flex">{chipDia()}</span>
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-xl"
                  style={{ boxShadow: '0 24px 48px -24px rgba(13, 30, 60, 0.4)' }}
                >
                  <Image
                    src={dia.imagen}
                    alt={`Día ${i + 1} — ${dia.titulo}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Título + etiqueta opcional + descripción justificada */}
            <div>
              {!dia.imagen && <span className="mb-3 inline-flex">{chipDia()}</span>}
              <h3
                className="font-plus-jakarta text-xl font-bold leading-tight sm:text-2xl"
                style={{ color: 'var(--text-primary)' }}
              >
                {dia.titulo}
              </h3>
              {dia.badge && (
                <span
                  className="mt-2 inline-block rounded px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'color-mix(in srgb, var(--orange) 10%, transparent)', color: 'var(--orange)' }}
                >
                  {dia.badge}
                </span>
              )}
              {dia.descripcion && (
                <p
                  className="mt-3 font-inter text-sm leading-relaxed sm:text-[15px]"
                  style={{ color: 'var(--text-dim)', textAlign: 'justify', hyphens: 'auto' }}
                >
                  {dia.descripcion}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
