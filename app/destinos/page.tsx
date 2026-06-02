import type { Metadata } from 'next'
import { getDestinos } from '@/lib/destinos'
import { DestinosLista } from '@/components/destinos/DestinosLista'
import { SectionTag } from '@/components/ui/SectionTag'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Destinos de Viaje',
  description:
    'Explora todos nuestros destinos nacionales e internacionales. Paquetes todo incluido desde Fusagasugá. Cotiza gratis.',
}

export default async function DestinosPage() {
  const destinos = await getDestinos()

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-32 pb-16 px-6"
        style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.95), var(--navy))' }}
      >
        {/* Decoración fondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-0 h-[500px] w-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-6xl">
          <SectionTag className="mb-4">Explora el mundo</SectionTag>

          <h1
            className="font-plus-jakarta text-4xl font-extrabold leading-tight sm:text-6xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Todos nuestros
            <br />
            <span style={{ color: 'var(--orange)' }}>destinos</span>
          </h1>

          <p
            className="mt-5 max-w-lg font-inter text-sm leading-relaxed sm:text-base"
            style={{ color: 'var(--text-dim)' }}
          >
            {destinos.length} destinos seleccionados para ti. Nacionales e internacionales,
            con atención personalizada desde Fusagasugá.
          </p>
        </div>
      </section>

      {/* Lista + filtros */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <DestinosLista destinos={destinos} />
        </div>
      </section>
    </>
  )
}
