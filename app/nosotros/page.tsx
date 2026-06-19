import type { Metadata } from 'next'
import Image from 'next/image'
import Script from 'next/script'
import { Target, Eye, Award, Users, MapPin, Star, Globe } from 'lucide-react'
import { SectionTag } from '@/components/ui/SectionTag'
import { Button } from '@/components/ui/Button'
import { EquipoSection } from '@/components/equipo/EquipoSection'
import { SITE, WHATSAPP, whatsappUrl } from '@/lib/site'
import { HOTELES_CRUCEROS, AEROLINEAS, type Alianza } from '@/lib/alianzas'

const schemaFAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Travel World Colombia es una agencia legalmente registrada?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. Travel World Colombia está registrada en el Registro Nacional de Turismo con el número RNT ${SITE.rnt}, cumpliendo todos los requisitos del Ministerio de Comercio, Industria y Turismo de Colombia.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Dónde están ubicados?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Estamos ubicados en ${SITE.direccion}, ${SITE.ciudad}, ${SITE.region}, Colombia. Atendemos de ${SITE.horario}.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo puedo cotizar un viaje?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Puedes cotizar tu viaje de forma gratuita a través de nuestro formulario en línea en ${SITE.url}/contacto, o escribirnos directamente por WhatsApp al ${WHATSAPP.telefonoDisplay}. Respondemos en menos de 24 horas.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuántos años de experiencia tienen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Travel World Colombia tiene más de 5 años de experiencia organizando viajes nacionales e internacionales para familias colombianas, con más de 126 reseñas de 5 estrellas verificadas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué destinos manejan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Manejamos más de 8 destinos nacionales e internacionales incluyendo República Dominicana, Estados Unidos, España, Panamá, Brasil, Japón, París y Santorini. Consulta todos en ${SITE.url}/destinos.`,
      },
    },
  ],
}

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Nuestra Historia',
  description:
    'Conoce a Travel World Colombia — agencia de viajes en Fusagasugá con más de 5 años de experiencia, 126 reseñas ⭐⭐⭐⭐⭐ y RNT 27287. Misión, visión y equipo.',
}

/* ─────────── DATOS ESTÁTICOS ─────────── */

const STATS = [
  { icon: Star,  num: '126',  label: 'reseñas 5 estrellas' },
  { icon: Globe, num: '8+',   label: 'destinos disponibles' },
  { icon: Users, num: '+5',   label: 'años de experiencia' },
  { icon: MapPin,num: '3',    label: 'centros de operación' },
]

/* ─────────── COMPONENTES INTERNOS ─────────── */

function Divider() {
  return (
    <div className="mx-auto my-2 h-px w-16" style={{ background: 'var(--border-orange)' }} />
  )
}

function LogoCard({ alianza }: { alianza: Alianza }) {
  return (
    <div className="alianza-item shrink-0">
      {alianza.logo ? (
        <Image
          src={alianza.logo}
          alt={alianza.alt}
          width={160}
          height={64}
          className="alianza-logo h-9 w-auto object-contain sm:h-11"
          draggable={false}
        />
      ) : (
        <span
          className="alianza-wordmark font-plus-jakarta text-base font-bold whitespace-nowrap"
          aria-label={alianza.alt}
        >
          {alianza.nombre}
        </span>
      )}
    </div>
  )
}

/* ─────────── PAGE ─────────── */

export default function NosotrosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-36 pb-24 px-6 text-center">
        {/* Imagen de fondo — paisaje andino del Sumapaz */}
        <Image
          src="/img/paginas/paisaje-andino-sumapaz-fusagasuga.webp"
          alt="Paisaje andino del Sumapaz cerca de Fusagasugá al amanecer — Travel World Colombia"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Overlay navy para legibilidad del texto */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,14,26,0.92) 0%, rgba(6,14,26,0.66) 55%, rgba(6,14,26,0.45) 100%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <SectionTag className="mb-4">Quiénes somos</SectionTag>
          <h1
            className="font-plus-jakarta text-4xl font-extrabold leading-tight sm:text-6xl"
            style={{ color: 'var(--text-primary)', textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}
          >
            Nuestra historia
          </h1>
          <Divider />
          <p
            className="mt-6 font-inter text-base leading-relaxed sm:text-lg"
            style={{ color: 'var(--text-primary)', opacity: 0.92, lineHeight: '1.75', textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}
          >
            Nacimos en Fusagasugá con un propósito claro: hacer que viajar sea
            accesible, seguro y memorable para cada familia colombiana.
            Hoy somos una de las agencias de mayor confianza en el Sumapaz.
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className="border-y px-6 py-12"
        style={{ borderColor: 'var(--border)', background: 'rgba(6,14,26,0.85)' }}
      >
        <ul className="mx-auto grid max-w-4xl gap-8 grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, num, label }) => (
            <li key={label} className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: 'rgba(244,130,31,0.12)', color: 'var(--orange)' }}
              >
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <p className="font-plus-jakarta text-3xl font-extrabold" style={{ color: 'var(--orange)' }}>
                {num}
              </p>
              <p className="font-cinzel text-[9px] tracking-[0.3em] uppercase text-center" style={{ color: 'var(--text-muted)' }}>
                {label}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── MISIÓN Y VISIÓN ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <SectionTag className="mb-3">Nuestro propósito</SectionTag>
            <h2
              className="font-plus-jakarta text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Misión &amp; Visión
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Misión */}
            <div
              className="flex flex-col gap-5 rounded-xl p-8"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(244,130,31,0.12)', color: 'var(--orange)' }}
              >
                <Target size={22} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-plus-jakarta text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Misión
                </h3>
                <p className="font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)', lineHeight: '1.8' }}>
                  Conectar a familias y viajeros colombianos con experiencias de viaje
                  excepcionales, ofreciendo asesoría personalizada, precios transparentes
                  y acompañamiento antes, durante y después de cada viaje. Somos el aliado
                  de confianza que convierte sueños en destinos reales.
                </p>
              </div>
            </div>

            {/* Visión */}
            <div
              className="flex flex-col gap-5 rounded-xl p-8"
              style={{
                background: 'rgba(244,130,31,0.05)',
                border: '1px solid var(--border-orange)',
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(244,130,31,0.15)', color: 'var(--orange)' }}
              >
                <Eye size={22} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-plus-jakarta text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Visión
                </h3>
                <p className="font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)', lineHeight: '1.8' }}>
                  Ser la agencia de viajes de referencia en el Sumapaz y Cundinamarca,
                  reconocida a nivel nacional por la calidad de nuestro servicio, la
                  satisfacción de nuestros viajeros y nuestra capacidad de abrir el mundo
                  para cada colombiano, sin importar su presupuesto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <EquipoSection />

      {/* ── ALIADOS HOTELEROS ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <SectionTag className="mb-3">Aliados</SectionTag>
            <h2
              className="font-plus-jakarta text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Cadenas hoteleras
            </h2>
            <p className="mt-3 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
              Trabajamos directamente con las mejores cadenas del Caribe y Colombia
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {HOTELES_CRUCEROS.map(a => <LogoCard key={a.nombre} alianza={a} />)}
          </div>
        </div>
      </section>

      {/* ── AEROLÍNEAS ── */}
      <section
        className="px-6 py-16"
        style={{ background: 'rgba(6,14,26,0.7)' }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <SectionTag className="mb-3">Aliados</SectionTag>
            <h2
              className="font-plus-jakarta text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Aerolíneas aliadas
            </h2>
            <p className="mt-3 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
              Acceso a tarifas especiales con las principales aerolíneas
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {AEROLINEAS.map(a => <LogoCard key={a.nombre} alianza={a} />)}
          </div>
        </div>
      </section>

      {/* ── RNT ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-col items-center gap-8 rounded-xl p-10 sm:flex-row sm:items-start"
            style={{ background: 'rgba(244,130,31,0.06)', border: '1px solid var(--border-orange)' }}
          >
            {/* Placeholder certificado */}
            <div
              className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(244,130,31,0.1)', border: '1px solid var(--border-orange)' }}
            >
              <Award size={44} strokeWidth={1} style={{ color: 'var(--orange)' }} />
            </div>

            <div className="text-center sm:text-left">
              <SectionTag className="mb-3">Registro Oficial</SectionTag>
              <h2
                className="font-plus-jakarta text-2xl font-extrabold sm:text-3xl"
                style={{ color: 'var(--text-primary)' }}
              >
                RNT {SITE.rnt}
              </h2>
              <p
                className="mt-3 max-w-lg font-inter text-sm leading-relaxed"
                style={{ color: 'var(--text-dim)', lineHeight: '1.75' }}
              >
                Travel World Colombia está registrada ante el{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  Registro Nacional de Turismo
                </strong>{' '}
                bajo el número <strong style={{ color: 'var(--orange)' }}>{SITE.rnt}</strong>,
                cumpliendo con todos los requisitos legales exigidos por el Ministerio
                de Comercio, Industria y Turismo de Colombia.
                Operamos con plena transparencia y respaldo institucional.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                <span
                  className="rounded-full px-4 py-1.5 font-inter text-xs"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  ✓ Agencia legalmente constituida
                </span>
                <span
                  className="rounded-full px-4 py-1.5 font-inter text-xs"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  ✓ Certificado vigente
                </span>
              </div>
              <p className="mt-4 font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>
                📎 Imagen del certificado — próximamente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESEÑAS (mismo widget del home) ── */}
      <section
        aria-labelledby="resenas-nosotros-title"
        className="px-6 py-20"
        style={{ background: 'rgba(6,14,26,0.6)' }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <SectionTag className="mb-3">Testimonios</SectionTag>
            <h2
              id="resenas-nosotros-title"
              className="font-plus-jakarta text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Lo que dicen nuestros viajeros
            </h2>
          </div>
          <Script
            src="https://reputationhub.site/reputation/assets/review-widget.js"
            strategy="lazyOnload"
          />
          <iframe
            className="lc_reviews_widget"
            src="https://reputationhub.site/reputation/widgets/review_widget/RMFUo0i4KOVl7eZHEn7s?widgetId=6a1da4d9fa32d9575fc393d4"
            frameBorder={0}
            scrolling="no"
            style={{ minWidth: '100%', width: '100%', border: 'none' }}
            title="Reseñas de clientes — Travel World Colombia"
          />
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        className="relative overflow-hidden px-6 py-20"
        style={{
          background:
            'linear-gradient(135deg, rgba(244,130,31,0.18) 0%, rgba(10,22,40,0.95) 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderTop: '1px solid var(--border-orange)',
            borderBottom: '1px solid var(--border-orange)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <SectionTag className="mb-4">¿Listo para viajar?</SectionTag>
          <h2
            className="font-plus-jakarta text-3xl font-extrabold leading-tight sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Hagamos tu viaje
            <br />
            <span style={{ color: 'var(--orange)' }}>realidad</span>
          </h2>
          <p
            className="mx-auto mt-5 max-w-md font-inter text-sm leading-relaxed"
            style={{ color: 'var(--text-dim)' }}
          >
            Más de 126 familias ya viajaron con nosotros. Cotiza gratis y recibe
            una propuesta personalizada en menos de 24 horas.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="whatsapp" href={whatsappUrl()}>
              Escribir por WhatsApp
            </Button>
            <Button variant="outline" href="/contacto">
              Formulario de cotización
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
