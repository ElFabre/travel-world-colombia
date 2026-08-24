import type { Metadata } from 'next'
import { Car, ShieldCheck, Smartphone, ArrowRight } from 'lucide-react'
import { SectionTag } from '@/components/ui/SectionTag'
import { Button } from '@/components/ui/Button'
import { WHATSAPP } from '@/lib/site'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Servicios de Viaje',
  description:
    'Servicios complementarios para tu viaje: renta de autos, seguro de viajes y SIM internacional. Todo con el respaldo de Travel World Colombia.',
  alternates: { canonical: '/servicios' },
}

/** Enlace de WhatsApp con un mensaje pre-cargado para el servicio. */
function waServicio(servicio: string): string {
  const texto = `Hola! Me interesa el servicio de ${servicio} 🙂`
  return `https://wa.me/${WHATSAPP.principal}?text=${encodeURIComponent(texto)}`
}

const SERVICIOS = [
  {
    icon: Car,
    titulo: 'Renta de autos',
    descripcion:
      'Muévete a tu ritmo en tu destino. Gestionamos el alquiler de tu vehículo con tarifas competitivas, cobertura y todo el respaldo para que solo te ocupes de disfrutar.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Seguro de viajes',
    descripcion:
      'Viaja tranquilo y protegido. Asistencia médica, cancelaciones, demoras y equipaje cubiertos, con planes a la medida de tu destino y los días de tu viaje.',
  },
  {
    icon: Smartphone,
    titulo: 'SIM internacional',
    descripcion:
      'Mantente conectado desde que aterrizas. Datos, llamadas y mensajes en el exterior sin las sorpresas del roaming, listos antes de salir de viaje.',
  },
]

export default function ServiciosPage() {
  return (
    <div className="tema-claro">
      {/* Hero */}
      <section className="tema-oscuro relative overflow-hidden px-6 pt-32 pb-16" style={{ background: 'var(--bg)' }}>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(41, 87, 164,0.35) 0%, transparent 60%)' }}
        />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionTag className="mb-4">Más que destinos</SectionTag>
          <h1
            className="font-plus-jakarta text-4xl font-extrabold leading-tight sm:text-6xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Nuestros
            <br />
            <span style={{ color: 'var(--orange)' }}>servicios</span>
          </h1>
          <p className="mt-5 max-w-lg font-inter text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
            Complementamos tu viaje con todo lo que necesitas: movilidad, protección y conexión,
            con la misma asesoría cercana de siempre.
          </p>
        </div>
      </section>

      {/* Tarjetas de servicios */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map(({ icon: Icon, titulo, descripcion }) => (
            <article
              key={titulo}
              className="u-lift flex flex-col rounded-2xl p-7"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <span
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', color: 'var(--orange)' }}
              >
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <h2 className="mb-2 font-plus-jakarta text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {titulo}
              </h2>
              <p className="mb-6 flex-1 font-inter text-base leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {descripcion}
              </p>
              <Button href={waServicio(titulo)} variant="whatsapp" size="sm" className="self-start" target="_blank" rel="noopener noreferrer">
                Consultar <ArrowRight size={13} />
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
