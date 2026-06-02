'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { SectionTag } from '@/components/ui/SectionTag'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--navy)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)' }}
      />

      <div className="relative max-w-lg">
        <p
          className="font-plus-jakarta text-[120px] font-extrabold leading-none"
          style={{ color: 'rgba(239,68,68,0.12)' }}
        >
          500
        </p>

        <div className="-mt-6">
          <SectionTag className="mb-4">Error inesperado</SectionTag>
          <h1
            className="font-plus-jakarta text-3xl font-extrabold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Algo salió mal
          </h1>
          <p
            className="mt-4 font-inter text-sm leading-relaxed"
            style={{ color: 'var(--text-dim)' }}
          >
            Ocurrió un error inesperado. Puedes intentar de nuevo o
            contactarnos directamente por WhatsApp.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reset}>Intentar de nuevo</Button>
            <Button variant="outline" href="/">Volver al inicio</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
