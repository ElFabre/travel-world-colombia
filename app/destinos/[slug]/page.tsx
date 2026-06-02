import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Clock, Users, Check, X } from 'lucide-react'
import { getDestino } from '@/lib/destinos'
import { SectionTag } from '@/components/ui/SectionTag'
import { Button } from '@/components/ui/Button'
import { whatsappUrl } from '@/lib/site'

export const revalidate = 1800

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getDestino(slug)
  if (!d) return {}
  return {
    title: d.meta_title ?? d.nombre,
    description: d.meta_description ?? d.descripcion ?? undefined,
    keywords: d.keywords,
    openGraph: {
      title: d.nombre,
      description: d.meta_description ?? d.descripcion ?? undefined,
      images: d.imagen_hero ? [{ url: d.imagen_hero }] : undefined,
    },
  }
}

export default async function DestinoPage({ params }: Props) {
  const { slug } = await params
  const d = await getDestino(slug)
  if (!d) notFound()

  const waUrl = whatsappUrl(d.nombre)

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative flex items-end overflow-hidden" style={{ minHeight: '90svh' }}>
        {/* Imagen de fondo */}
        {d.imagen_hero ? (
          <Image
            src={d.imagen_hero}
            alt={d.nombre}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ zIndex: 0 }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: 'var(--blue)', zIndex: 0 }} />
        )}

        {/* Gradiente overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(6,14,26,0.97) 0%, rgba(6,14,26,0.55) 50%, rgba(6,14,26,0.2) 100%)',
            zIndex: 1,
          }}
        />

        {/* Contenido hero */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-32">
          <SectionTag className="mb-4">{d.pais}</SectionTag>

          <h1
            className="font-plus-jakarta text-5xl font-extrabold leading-none sm:text-7xl lg:text-8xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {d.nombre}
          </h1>

          {d.frase_hero && (
            <p
              className="mt-5 max-w-xl font-inter text-base leading-relaxed sm:text-lg"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {d.frase_hero}
            </p>
          )}

          {d.autor_frase && (
            <p className="mt-3 font-cinzel text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
              — {d.autor_frase}{d.cargo_autor ? `, ${d.cargo_autor}` : ''}
            </p>
          )}

          {/* Info rápida */}
          <div className="mt-8 flex flex-wrap gap-4">
            {d.duracion && (
              <span
                className="flex items-center gap-2 rounded-full px-4 py-2 font-inter text-sm backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
              >
                <Clock size={14} />
                {d.duracion}
              </span>
            )}
            {d.cupos_disponibles !== undefined && d.cupos_disponibles > 0 && (
              <span
                className="flex items-center gap-2 rounded-full px-4 py-2 font-inter text-sm backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
              >
                <Users size={14} />
                {d.cupos_disponibles} cupos disponibles
              </span>
            )}
            {d.precio_desde && (
              <span
                className="flex items-center gap-2 rounded-full px-4 py-2 font-plus-jakarta text-sm font-bold"
                style={{ background: 'var(--orange)', color: '#fff', boxShadow: '0 4px 20px rgba(244,130,31,0.45)' }}
              >
                Desde {d.precio_desde}
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="whatsapp" href={waUrl}>Cotizar este viaje</Button>
            <Button variant="outline" href="/destinos">Ver otros destinos</Button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      {d.stats && d.stats.length > 0 && (
        <section
          className="border-y px-6 py-10"
          style={{ borderColor: 'var(--border)', background: 'rgba(6,14,26,0.8)' }}
        >
          <ul className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {d.stats.map(s => (
              <li key={s.label} className="text-center">
                <p
                  className="font-plus-jakarta text-3xl font-extrabold"
                  style={{ color: 'var(--orange)' }}
                >
                  {s.num}
                </p>
                <p className="mt-1 font-cinzel text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
                  {s.label}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── DESCRIPCIÓN + IMAGEN ABOUT ── */}
      {(d.descripcion || d.imagen_about) && (
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionTag className="mb-4">Sobre el destino</SectionTag>
              <h2
                className="font-plus-jakarta text-3xl font-bold leading-tight sm:text-4xl"
                style={{ color: 'var(--text-primary)' }}
              >
                {d.subtitulo ?? `Por qué elegir ${d.nombre}`}
              </h2>
              {d.descripcion && (
                <p
                  className="mt-5 font-inter text-sm leading-relaxed sm:text-base"
                  style={{ color: 'var(--text-dim)', lineHeight: '1.75' }}
                >
                  {d.descripcion}
                </p>
              )}
            </div>

            {d.imagen_about && (
              <div className="relative h-80 overflow-hidden rounded-lg lg:h-96"
                style={{ border: '1px solid var(--border)' }}>
                <Image
                  src={d.imagen_about}
                  alt={`${d.nombre} — imagen`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── HIGHLIGHTS ── */}
      {d.highlights && d.highlights.length > 0 && (
        <section
          className="px-6 py-20"
          style={{ background: 'rgba(10,22,40,0.5)' }}
        >
          <div className="mx-auto max-w-6xl">
            <SectionTag className="mb-4">Lo que te espera</SectionTag>
            <h2
              className="mb-10 font-plus-jakarta text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Experiencias únicas
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {d.highlights.map(h => (
                <li
                  key={h.titulo}
                  className="flex gap-4 rounded-lg p-5"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                  <span className="text-2xl shrink-0" role="img" aria-hidden>{h.icono}</span>
                  <div>
                    <p className="font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {h.titulo}
                    </p>
                    <p className="mt-1 font-inter text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                      {h.descripcion}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── INFO CLAVE ── */}
      {d.info_clave && d.info_clave.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <SectionTag className="mb-4">Información clave</SectionTag>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.info_clave.map(item => (
                <li
                  key={item.label}
                  className="flex items-start gap-3 rounded-lg p-4"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                  <span className="text-xl shrink-0" role="img" aria-hidden>{item.icono}</span>
                  <div>
                    <p className="font-cinzel text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                      {item.label}
                    </p>
                    <p className="font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {item.valor}
                    </p>
                    {item.sub && (
                      <p className="mt-0.5 font-inter text-[11px]" style={{ color: 'var(--text-dim)' }}>{item.sub}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── INCLUYE / NO INCLUYE ── */}
      {(d.incluye?.length || d.no_incluye?.length) ? (
        <section
          className="px-6 py-16"
          style={{ background: 'rgba(6,14,26,0.6)' }}
        >
          <div className="mx-auto max-w-6xl">
            <SectionTag className="mb-4">El paquete</SectionTag>
            <h2
              className="mb-10 font-plus-jakarta text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              ¿Qué incluye?
            </h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {d.incluye && d.incluye.length > 0 && (
                <div>
                  <p
                    className="mb-4 font-plus-jakarta text-sm font-bold tracking-wide uppercase"
                    style={{ color: 'var(--orange)' }}
                  >
                    Incluye
                  </p>
                  <ul className="space-y-3">
                    {d.incluye.map(item => (
                      <li key={item} className="flex items-start gap-3 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
                        <Check size={15} className="mt-0.5 shrink-0" style={{ color: '#22c55e' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {d.no_incluye && d.no_incluye.length > 0 && (
                <div>
                  <p
                    className="mb-4 font-plus-jakarta text-sm font-bold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No incluye
                  </p>
                  <ul className="space-y-3">
                    {d.no_incluye.map(item => (
                      <li key={item} className="flex items-start gap-3 font-inter text-sm" style={{ color: 'var(--text-muted)' }}>
                        <X size={15} className="mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── GALERÍA ── */}
      {d.galeria && d.galeria.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <SectionTag className="mb-4">Galería</SectionTag>
            <h2
              className="mb-8 font-plus-jakarta text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Imágenes del destino
            </h2>
            <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {d.galeria.map((src, i) => (
                <li key={i} className={`relative overflow-hidden rounded-lg ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                  style={{ aspectRatio: i === 0 ? '4/3' : '1/1' }}>
                  <Image
                    src={src}
                    alt={`${d.nombre} — foto ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ── */}
      <section
        className="relative overflow-hidden px-6 py-20"
        style={{ background: 'linear-gradient(135deg, rgba(244,130,31,0.15) 0%, rgba(10,22,40,0.9) 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ borderTop: '1px solid var(--border-orange)', borderBottom: '1px solid var(--border-orange)' }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <SectionTag className="mb-4">¿Listo para viajar?</SectionTag>
          <h2
            className="font-plus-jakarta text-3xl font-extrabold leading-tight sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {d.cta_titulo ?? `Viaja a ${d.nombre}`}
          </h2>
          {d.cta_subtitulo && (
            <p className="mx-auto mt-4 max-w-lg font-inter text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-dim)' }}>
              {d.cta_subtitulo}
            </p>
          )}
          {d.precio_desde && (
            <p className="mt-3 font-plus-jakarta text-lg font-bold" style={{ color: 'var(--orange)' }}>
              Desde {d.precio_desde}
            </p>
          )}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="whatsapp" href={waUrl}>Cotizar por WhatsApp</Button>
            <Button variant="outline" href="/destinos">Ver otros destinos</Button>
          </div>
        </div>
      </section>
    </>
  )
}
