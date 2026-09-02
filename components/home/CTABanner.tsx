import { Button } from '@/components/ui/Button'
import { SITE, whatsappUrl } from '@/lib/site'
import { Plane } from 'lucide-react'

export function CTABanner() {
  return (
    <section
      aria-label="Llamado a la acción"
      className="tema-oscuro relative overflow-hidden py-20 px-6"
    >
      {/* Fondo con gradiente y overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--orange) 18%, transparent) 0%, rgba(41, 87, 164,0.5) 50%, rgba(8, 18, 38,0.8) 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ borderTop: '1px solid var(--border-orange)', borderBottom: '1px solid var(--border-orange)' }}
      />

      {/* Círculos decorativos */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-5 flex justify-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--orange) 15%, transparent)', color: 'var(--orange)' }}
          >
            <Plane size={28} strokeWidth={1.5} />
          </span>
        </div>

        <h2
          className="font-plus-jakarta text-3xl font-bold leading-tight sm:text-5xl"
          style={{ color: 'var(--text-primary)' }}
        >
          Tu próxima aventura <br />
          <span style={{ color: 'var(--orange)' }}>empieza aquí</span>
        </h2>

        <p
          className="mx-auto mt-5 max-w-lg font-inter text-sm leading-relaxed sm:text-base"
          style={{ color: 'var(--text-dim)' }}
        >
          Cotiza gratis en menos de 24 horas. Sin compromisos. Más de {SITE.familias} familias ya confían en nosotros.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button variant="whatsapp" size="md" href={whatsappUrl()}>
            Cotizar por WhatsApp
          </Button>
          <Button variant="outline" size="md" href="/destinos">
            Ver destinos
          </Button>
        </div>
      </div>
    </section>
  )
}
