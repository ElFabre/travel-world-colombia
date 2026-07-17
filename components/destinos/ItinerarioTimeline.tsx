import type { ItinerarioDia } from '@/types/destino'

/**
 * Línea de tiempo del itinerario día a día. En escritorio alterna el contenido
 * a ambos lados de una línea central con el marcador del día; en móvil la
 * línea va a la izquierda y el contenido apilado a la derecha. El número de
 * día sale de la posición en el array (como se cargan en el panel).
 */
export function ItinerarioTimeline({ dias }: { dias: ItinerarioDia[] }) {
  return (
    <div className="relative">
      {/* Línea vertical */}
      <div
        aria-hidden
        className="absolute bottom-7 top-7 left-7 w-0.5 md:left-1/2 md:-translate-x-1/2"
        style={{ background: 'color-mix(in srgb, var(--orange) 28%, transparent)' }}
      />

      <ol className="flex flex-col gap-12">
        {dias.map((dia, i) => {
          const invertido = i % 2 === 1
          return (
            <li key={i} className="destino-reveal relative md:grid md:grid-cols-2 md:items-center md:gap-28">
              {/* Marcador del día */}
              <span
                className="absolute left-7 top-0 z-10 flex h-14 w-14 -translate-x-1/2 flex-col items-center justify-center rounded-full md:left-1/2 md:top-1/2 md:-translate-y-1/2"
                style={{
                  background: 'var(--orange)',
                  border: '4px solid #fff',
                  color: '#fff',
                  boxShadow: '0 10px 24px -8px color-mix(in srgb, var(--orange) 55%, transparent)',
                }}
              >
                <span className="font-cinzel text-[8px] font-bold uppercase leading-none tracking-widest">Día</span>
                <span className="font-plus-jakarta text-lg font-extrabold leading-none">{String(i + 1).padStart(2, '0')}</span>
              </span>

              {/* Descripción (solo escritorio; en móvil va bajo el título) */}
              <div className={`hidden md:block ${invertido ? 'md:order-2' : 'text-right'}`}>
                {dia.descripcion && (
                  <p
                    className={`font-inter text-sm leading-relaxed ${invertido ? 'max-w-xs' : 'ml-auto max-w-xs'}`}
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {dia.descripcion}
                  </p>
                )}
              </div>

              {/* Título + etiqueta */}
              <div className={`pl-16 md:pl-0 ${invertido ? 'md:order-1 md:text-right' : ''}`}>
                <h3 className="font-plus-jakarta text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
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
                  <p className="mt-2 font-inter text-sm leading-relaxed md:hidden" style={{ color: 'var(--text-dim)' }}>
                    {dia.descripcion}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
