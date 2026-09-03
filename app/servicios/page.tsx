import type { Metadata } from 'next'
import {
  Plane,
  BedDouble,
  Luggage,
  Route,
  Compass,
  FerrisWheel,
  Car,
  ShieldCheck,
  Smartphone,
  TrainFront,
  Ship,
  ArrowRight,
} from 'lucide-react'
import { SectionTag } from '@/components/ui/SectionTag'
import { Button } from '@/components/ui/Button'
import { WHATSAPP } from '@/lib/site'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Servicios de Viaje',
  description:
    'Todo para tu viaje en un solo lugar: vuelos, alojamientos, paquetes, circuitos, actividades, parques temáticos, alquiler de vehículos, seguro de viajes, SIM card, tickets de tren y cruceros. Con el respaldo de Travel World Colombia.',
  alternates: { canonical: '/servicios' },
}

/** Enlace de WhatsApp con un mensaje pre-cargado para el servicio. */
function waServicio(servicio: string): string {
  const texto = `Hola! Me interesa el servicio de ${servicio} 🙂`
  return `https://wa.me/${WHATSAPP.principal}?text=${encodeURIComponent(texto)}`
}

interface Servicio {
  icon: typeof Plane
  /** Ancla de la tarjeta (#slug) — debe coincidir con SERVICIOS_MENU en lib/site.ts. */
  slug: string
  titulo: string
  descripcion: string
  /** Si existe, la tarjeta enlaza a esta ruta interna en vez de WhatsApp. */
  href?: string
  cta?: string
}

const SERVICIOS: Servicio[] = [
  {
    icon: Plane,
    slug: 'vuelos',
    titulo: 'Vuelos',
    descripcion:
      'Encontramos el vuelo que mejor se ajusta a tus fechas y presupuesto: nacionales e internacionales, con asesoría en escalas, equipaje y las mejores tarifas disponibles.',
  },
  {
    icon: BedDouble,
    slug: 'alojamientos',
    titulo: 'Alojamientos',
    descripcion:
      'Hoteles, apartamentos y estadías con la ubicación y el confort que buscas. Reservamos por ti con tarifas convenidas y la tranquilidad de tener todo confirmado.',
  },
  {
    icon: Luggage,
    slug: 'paquetes',
    titulo: 'Paquetes',
    descripcion:
      'Vuelo, hotel, traslados y experiencias en un solo plan, armado a tu medida. Tú eliges el destino y nosotros nos encargamos de todo lo demás.',
  },
  {
    icon: Route,
    slug: 'circuitos',
    titulo: 'Circuitos',
    descripcion:
      'Recorre varias ciudades o países en un solo viaje con rutas organizadas, guías y logística resuelta. Ideal para conocer más, sin preocuparte por nada.',
  },
  {
    icon: Compass,
    slug: 'actividades',
    titulo: 'Actividades',
    descripcion:
      'Tours, excursiones y experiencias en tu destino: gastronomía, aventura, cultura y más. Reservadas con anticipación para que no te quedes por fuera.',
  },
  {
    icon: FerrisWheel,
    slug: 'parques-tematicos',
    titulo: 'Parques temáticos',
    descripcion:
      'Entradas a los parques más visitados del mundo: Disney, Universal y muchos más. Con asesoría para elegir los días y pases que más te convienen.',
  },
  {
    icon: Car,
    slug: 'alquiler-de-vehiculos',
    titulo: 'Alquiler de vehículos',
    descripcion:
      'Muévete a tu ritmo en tu destino. Gestionamos el alquiler de tu vehículo con tarifas competitivas, cobertura y todo el respaldo para que solo te ocupes de disfrutar.',
  },
  {
    icon: ShieldCheck,
    slug: 'seguro-de-viajes',
    titulo: 'Seguro de viajes',
    descripcion:
      'Viaja tranquilo y protegido. Asistencia médica, cancelaciones, demoras y equipaje cubiertos, con planes a la medida de tu destino y los días de tu viaje.',
  },
  {
    icon: Smartphone,
    slug: 'sim-card',
    titulo: 'SIM card',
    descripcion:
      'Mantente conectado desde que aterrizas. Datos, llamadas y mensajes en el exterior sin las sorpresas del roaming, listos antes de salir de viaje.',
  },
  {
    icon: TrainFront,
    slug: 'tickets-de-tren',
    titulo: 'Tickets de tren',
    descripcion:
      'Boletos de tren para moverte entre ciudades en Europa, Asia y más. Horarios, clases y conexiones resueltas antes de tu viaje, sin filas ni complicaciones.',
  },
  {
    icon: Ship,
    slug: 'cruceros',
    titulo: 'Cruceros',
    descripcion:
      'Navega por el Caribe, el Mediterráneo y los destinos más soñados. Te asesoramos con la naviera, la cabina y el itinerario perfectos para ti.',
    href: '/cruceros',
    cta: 'Ver cruceros',
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
            Todo lo que tu viaje necesita, en un solo lugar: vuelos, alojamientos, paquetes,
            experiencias y más, con la misma asesoría cercana de siempre.
          </p>
        </div>
      </section>

      {/* Tarjetas de servicios */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map(({ icon: Icon, slug, titulo, descripcion, href, cta }) => (
            <article
              key={titulo}
              id={slug}
              className="u-lift flex scroll-mt-28 flex-col rounded-2xl p-7"
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
              {href ? (
                <Button href={href} size="sm" className="self-start">
                  {cta} <ArrowRight size={13} />
                </Button>
              ) : (
                <Button href={waServicio(titulo)} variant="whatsapp" size="sm" className="self-start" target="_blank" rel="noopener noreferrer">
                  Consultar <ArrowRight size={13} />
                </Button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
