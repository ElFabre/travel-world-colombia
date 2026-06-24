import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { MessageCircle, Headset, Map, PlayCircle, ArrowRight, Plane } from 'lucide-react'
import { SectionTag } from '@/components/ui/SectionTag'
import { SOCIALS } from '@/lib/site'

interface Paso {
  icon: LucideIcon
  pre: string
  highlight: string
  descripcion: string
}

const PASOS: Paso[] = [
  {
    icon: MessageCircle,
    pre: 'Cuéntanos tu ',
    highlight: 'viaje soñado',
    descripcion:
      'Completa nuestro formulario o escríbenos por WhatsApp. Cuéntanos el destino, las fechas, cuántas personas viajan y tu presupuesto. ¡Entre más detallado, mejor!',
  },
  {
    icon: Headset,
    pre: 'Conoce a tu ',
    highlight: 'asesor experto',
    descripcion:
      'Te asignamos un asesor especializado según tu destino de interés. Te respondemos rápido y te acompañamos en cada paso, en cualquier momento.',
  },
  {
    icon: Map,
    pre: 'Crea ',
    highlight: 'tu itinerario único',
    descripcion:
      'Tu asesor diseña una propuesta personalizada con tiquetes, hotel, traslados y actividades. Tú decides, nosotros organizamos todo.',
  },
]

export function ComoFunciona() {
  return (
    <section
      aria-labelledby="como-funciona-title"
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: 'var(--bg)' }}
    >
      {/* Textura de ruido sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: 0.03,
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center md:mb-24">
          <SectionTag className="mb-4">El proceso</SectionTag>
          <h2
            id="como-funciona-title"
            className="font-plus-jakarta text-4xl font-extrabold leading-tight sm:text-6xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Cómo <span style={{ color: 'var(--orange)' }}>¡Funciona!</span>
          </h2>

          <a
            href={SOCIALS.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="como-funciona-video group mt-6 inline-flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <PlayCircle size={22} style={{ color: 'var(--orange)' }} />
            <span
              className="font-inter text-base"
              style={{ borderBottom: '1px solid var(--orange)', paddingBottom: '1px' }}
            >
              Ver video de presentación
            </span>
          </a>
        </div>

        {/* Pasos */}
        <div className="relative mb-16">
          {/* Línea punteada conectora con flujo izquierda → derecha (solo desktop) */}
          <div
            aria-hidden
            className="como-flujo-linea absolute left-[16%] right-[16%] top-12 hidden h-0.5 lg:block"
          />

          {/* Avión que recorre la línea indicando el flujo del proceso */}
          <div
            aria-hidden
            className="como-flujo-avion absolute top-12 hidden -translate-y-1/2 lg:flex"
            style={{ zIndex: 5 }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'var(--navy)', border: '1px solid var(--border-orange)' }}
            >
              <Plane size={26} style={{ color: 'var(--orange)', transform: 'rotate(45deg)' }} />
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-8">
            {PASOS.map(paso => {
              const Icon = paso.icon
              return (
                <div key={paso.highlight} className="group flex flex-col items-center text-center">
                  <div
                    className="mb-8 flex h-24 w-24 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: 'var(--orange)',
                      boxShadow: '0 0 30px rgba(244,130,31,0.25)',
                    }}
                  >
                    <Icon size={40} color="#fff" strokeWidth={1.75} />
                  </div>

                  <h3
                    className="mb-4 font-plus-jakarta text-2xl font-extrabold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {paso.pre}
                    <span style={{ color: 'var(--orange)' }}>{paso.highlight}</span>
                  </h3>

                  <p
                    className="max-w-sm font-inter text-base leading-relaxed"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {paso.descripcion}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link
            href="/contacto"
            className="como-funciona-cta inline-flex items-center gap-3 rounded-full px-10 py-5 font-plus-jakarta text-base font-bold uppercase tracking-[0.1em] text-white"
            style={{ background: 'var(--orange)' }}
          >
            Personalizar mi viaje
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
