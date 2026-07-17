import { Shield, Star, Clock, Award } from 'lucide-react'
import { SITE } from '@/lib/site'

const items = [
  {
    icon: Star,
    value: `${SITE.reseñas} reseñas`,
    label: '5 estrellas verificadas',
  },
  {
    icon: Shield,
    value: `RNT ${SITE.rnt}`,
    label: 'Registro Nacional de Turismo',
  },
  {
    icon: Clock,
    value: '+5 años',
    label: 'de experiencia',
  },
  {
    icon: Award,
    value: '100% confiable',
    label: 'Agencia certificada',
  },
]

export function TrustBar() {
  return (
    <section
      aria-label="Credenciales de confianza"
      className="relative z-10 border-y"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-alt)' }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map(({ icon: Icon, value, label }) => (
            <li key={value} className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', color: 'var(--orange)' }}
              >
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <p className="font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
              <p className="font-inter text-base leading-snug" style={{ color: 'var(--text-dim)' }}>
                {label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
