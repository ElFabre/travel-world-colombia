import Link from 'next/link'
import { SectionTag } from '@/components/ui/SectionTag'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--navy)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-lg">
        <p
          className="font-plus-jakarta text-[120px] font-extrabold leading-none"
          style={{ color: 'rgba(244,130,31,0.15)' }}
        >
          404
        </p>

        <div className="-mt-6">
          <SectionTag className="mb-4">Página no encontrada</SectionTag>
          <h1
            className="font-plus-jakarta text-3xl font-extrabold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Esta página no existe
          </h1>
          <p
            className="mt-4 font-inter text-sm leading-relaxed"
            style={{ color: 'var(--text-dim)' }}
          >
            La página que buscas no existe o fue movida.
            Explora nuestros destinos o vuelve al inicio.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button href="/">Volver al inicio</Button>
            <Button variant="outline" href="/destinos">Ver destinos</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
