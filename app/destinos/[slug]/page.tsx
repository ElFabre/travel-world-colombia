import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Clock, Users, Check, X, ArrowRight, Quote, Star } from 'lucide-react'
import { getDestino, getResenaDestino } from '@/lib/destinos'
import { SectionTag } from '@/components/ui/SectionTag'
import { Icono } from '@/components/ui/Icono'
import { Button } from '@/components/ui/Button'
import { SITE, whatsappUrl } from '@/lib/site'

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
  const resena = await getResenaDestino(d.nombre)
  // Foto de "Sobre el destino": la dedicada, o la miniatura/hero como respaldo.
  const aboutImg = d.imagen_about ?? d.imagen_thumb ?? d.imagen_hero

  // Información clave: máximo 4 datos, sin temperatura/clima.
  const infoClave = (d.info_clave ?? [])
    .filter(i => !/temperatura|clima|grados|°/i.test(`${i.label} ${i.valor} ${i.sub ?? ''}`))
    .slice(0, 4)

  const schemaTouristDestination = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristDestination',
        name: d.nombre,
        description: d.descripcion ?? undefined,
        url: `${SITE.url}/destinos/${d.slug}`,
        image: d.imagen_hero ?? d.imagen_thumb ?? undefined,
        touristType: { '@type': 'Audience', audienceType: 'Travelers' },
        includesAttraction: d.highlights?.map(h => ({
          '@type': 'TouristAttraction',
          name: h.titulo,
          description: h.descripcion,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio',    item: SITE.url },
          { '@type': 'ListItem', position: 2, name: 'Destinos',  item: `${SITE.url}/destinos` },
          { '@type': 'ListItem', position: 3, name: d.nombre,    item: `${SITE.url}/destinos/${d.slug}` },
        ],
      },
    ],
  }

  return (
    <div className="tema-claro">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaTouristDestination) }}
      />

      {/* ── HERO ── */}
      <section className="tema-oscuro relative flex items-end overflow-hidden" style={{ minHeight: '90svh' }}>
        {d.imagen_hero ? (
          <Image src={d.imagen_hero} alt={d.nombre} fill priority sizes="100vw" className="object-cover" style={{ zIndex: 0 }} />
        ) : (
          <div className="absolute inset-0" style={{ background: 'var(--blue)', zIndex: 0 }} />
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(6,14,26,0.97) 0%, rgba(6,14,26,0.55) 50%, rgba(6,14,26,0.2) 100%)',
            zIndex: 1,
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-32">
          <div className="destino-hero-in">
            <SectionTag className="mb-4">{d.pais}</SectionTag>
            <h1 className="font-plus-jakarta text-5xl font-extrabold leading-none sm:text-7xl lg:text-8xl" style={{ color: 'var(--text-primary)' }}>
              {d.nombre}
            </h1>
            {d.frase_hero && (
              <p className="mt-5 max-w-xl font-inter text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(255,255,255,0.78)' }}>
                {d.frase_hero}
              </p>
            )}
            {d.autor_frase && (
              <p className="mt-3 font-cinzel text-[11px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
                — {d.autor_frase}{d.cargo_autor ? `, ${d.cargo_autor}` : ''}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              {d.duracion && (
                <span className="flex items-center gap-2 rounded-full px-4 py-2 font-inter text-sm backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  <Clock size={14} /> {d.duracion}
                </span>
              )}
              {d.cupos_disponibles !== undefined && d.cupos_disponibles > 0 && (
                <span className="flex items-center gap-2 rounded-full px-4 py-2 font-inter text-sm backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  <Users size={14} /> {d.cupos_disponibles} cupos disponibles
                </span>
              )}
              {d.precio_desde && (
                <span className="flex items-center gap-2 rounded-full px-4 py-2 font-plus-jakarta text-sm font-bold" style={{ background: 'var(--orange)', color: '#fff', boxShadow: '0 4px 20px rgba(244,130,31,0.45)' }}>
                  Desde {d.precio_desde}
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="whatsapp" href={waUrl}>Cotizar este viaje</Button>
              <Button variant="outline" href="/destinos">Ver otros destinos</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      {d.stats && d.stats.length > 0 && (
        <section className="border-y px-6 py-12" style={{ borderColor: 'var(--border)', background: 'var(--bg-alt)' }}>
          <ul className="mx-auto grid max-w-6xl gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {d.stats.map(s => (
              <li key={s.label} className="destino-reveal text-center">
                <p className="font-plus-jakarta text-4xl font-extrabold tracking-tight" style={{ color: 'var(--orange)' }}>{s.num}</p>
                <p className="mt-2 font-cinzel text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: 'var(--text-dim)' }}>
                  {s.label}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── SOBRE EL DESTINO (texto + foto + testimonio) ── */}
      {(d.descripcion || aboutImg) && (
        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div className="destino-reveal">
              <SectionTag className="mb-4">Sobre el destino</SectionTag>
              <h2 className="font-plus-jakarta text-3xl font-bold leading-[1.1] sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                {d.subtitulo ?? `Por qué elegir ${d.nombre}`}
              </h2>
              {d.descripcion && (
                <p className="mt-6 font-inter text-base" style={{ color: 'var(--text-dim)', lineHeight: '1.8' }}>
                  {d.descripcion}
                </p>
              )}
              <a href={waUrl} className="group mt-8 inline-flex items-center gap-2 font-plus-jakarta text-sm font-bold" style={{ color: 'var(--eyebrow)' }}>
                Descubre más sobre este plan
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
              </a>
            </div>

            <div className="destino-reveal relative">
              <div className="relative h-[26rem] overflow-hidden rounded-2xl lg:h-[32rem]" style={{ boxShadow: '0 40px 80px -32px rgba(10,22,40,0.45)' }}>
                {aboutImg ? (
                  <Image src={aboutImg} alt={`${d.nombre} — imagen`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ background: 'linear-gradient(135deg, #16315a, #0a1628)' }}>
                    <Icono nombre="image" size={64} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.22)' }} />
                  </div>
                )}
              </div>
              {/* Acento decorativo */}
              <div aria-hidden className="absolute -right-4 -top-4 -z-10 hidden h-40 w-40 rounded-2xl lg:block" style={{ background: 'rgba(244,130,31,0.12)' }} />

              {resena && (
                  <figure
                    className="absolute -bottom-6 left-4 right-4 rounded-xl p-5 sm:left-6 sm:right-auto sm:max-w-xs"
                    style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 24px 48px -20px rgba(10,22,40,0.35)' }}
                  >
                    <Quote size={20} style={{ color: 'var(--orange)' }} />
                    <blockquote className="mt-2 font-inter text-sm italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      “{resena.texto}”
                    </blockquote>
                    <figcaption className="mt-3 flex items-center justify-between">
                      <span className="font-plus-jakarta text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{resena.nombre}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: resena.estrellas ?? 5 }).map((_, i) => <Star key={i} size={11} fill="var(--orange)" style={{ color: 'var(--orange)' }} />)}
                      </span>
                    </figcaption>
                  </figure>
                )}
              </div>
          </div>
        </section>
      )}

      {/* ── EXPERIENCIAS ÚNICAS (3 cards con imagen) ── */}
      {d.highlights && d.highlights.length > 0 && (
        <section className="px-6 py-24" style={{ background: 'var(--bg-alt)' }}>
          <div className="mx-auto max-w-6xl">
            <div className="destino-reveal mb-12 max-w-2xl">
              <SectionTag className="mb-4">Lo que te espera</SectionTag>
              <h2 className="font-plus-jakarta text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                Experiencias únicas
              </h2>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {d.highlights.slice(0, 3).map(h => (
                <li
                  key={h.titulo}
                  className="exp-card destino-reveal flex flex-col overflow-hidden rounded-2xl"
                  style={{ background: '#fff', border: '1px solid var(--border)' }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--blue)' }}>
                    {h.imagen ? (
                      <Image src={h.imagen} alt={h.titulo} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icono nombre={h.icono} size={52} strokeWidth={1.3} style={{ color: 'rgba(255,255,255,0.6)' }} />
                      </div>
                    )}
                    {h.imagen && h.icono && (
                      <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}>
                        <Icono nombre={h.icono} size={18} style={{ color: 'var(--navy)' }} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <h3 className="font-plus-jakarta text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{h.titulo}</h3>
                    <p className="font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{h.descripcion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── INFORMACIÓN CLAVE (4 cards navy) ── */}
      {infoClave.length > 0 && (
        <section className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="destino-reveal mb-12 text-center">
              <SectionTag className="mb-4">Información clave</SectionTag>
              <h2 className="font-plus-jakarta text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                Lo que necesitas saber
              </h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {infoClave.map(item => (
                <li
                  key={item.label}
                  className="destino-reveal tema-oscuro flex flex-col gap-3 rounded-2xl p-6"
                  style={{ background: '#16315a', boxShadow: '0 24px 48px -28px rgba(10,22,40,0.6)' }}
                >
                  <Icono nombre={item.icono} size={30} strokeWidth={1.5} style={{ color: 'var(--orange)' }} />
                  <div>
                    <p className="font-cinzel text-[11px] font-semibold tracking-[0.22em] uppercase" style={{ color: 'var(--orange)' }}>
                      {item.label}
                    </p>
                    <p className="mt-1 font-plus-jakarta text-xl font-bold" style={{ color: '#fff' }}>{item.valor}</p>
                    {item.sub && <p className="mt-0.5 font-inter text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.sub}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── QUÉ INCLUYE (sección azul marino) ── */}
      {(d.incluye?.length || d.no_incluye?.length) ? (
        <section className="tema-oscuro relative overflow-hidden px-6 py-24" style={{ background: 'var(--navy)' }}>
          {/* Atmósfera */}
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(244,130,31,0.12), transparent 55%)' }} />
          <div className="relative mx-auto max-w-6xl">
            <div className="destino-reveal mb-12">
              <SectionTag className="mb-4">El paquete</SectionTag>
              <h2 className="font-plus-jakarta text-3xl font-bold sm:text-4xl" style={{ color: '#fff' }}>
                ¿Qué incluye tu viaje?
              </h2>
            </div>
            <div className="grid gap-10 sm:grid-cols-2">
              {d.incluye && d.incluye.length > 0 && (
                <div className="destino-reveal">
                  <p className="mb-5 font-plus-jakarta text-sm font-bold tracking-wide uppercase" style={{ color: '#4ade80' }}>Incluye</p>
                  <ul className="space-y-4">
                    {d.incluye.map(item => (
                      <li key={item} className="flex items-start gap-3 font-inter text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(74,222,128,0.15)' }}>
                          <Check size={13} style={{ color: '#4ade80' }} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {d.no_incluye && d.no_incluye.length > 0 && (
                <div className="destino-reveal">
                  <p className="mb-5 font-plus-jakarta text-sm font-bold tracking-wide uppercase" style={{ color: '#f87171' }}>No incluye</p>
                  <ul className="space-y-4">
                    {d.no_incluye.map(item => (
                      <li key={item} className="flex items-start gap-3 font-inter text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(248,113,113,0.15)' }}>
                          <X size={13} style={{ color: '#f87171' }} />
                        </span>
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
        <section className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="destino-reveal mb-10">
              <SectionTag className="mb-4">Galería</SectionTag>
              <h2 className="font-plus-jakarta text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                Imágenes del destino
              </h2>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {d.galeria.map((src, i) => (
                <li key={i} className={`destino-reveal exp-card relative overflow-hidden rounded-xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`} style={{ aspectRatio: i === 0 ? '4/3' : '1/1' }}>
                  <Image src={src} alt={`${d.nombre} — foto ${i + 1}`} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ── */}
      <section className="tema-oscuro relative overflow-hidden px-6 py-24" style={{ background: 'linear-gradient(135deg, rgba(244,130,31,0.15) 0%, rgba(10,22,40,0.9) 100%)' }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ borderTop: '1px solid var(--border-orange)', borderBottom: '1px solid var(--border-orange)' }} />
        <div className="destino-reveal relative mx-auto max-w-3xl text-center">
          <SectionTag className="mb-4">¿Listo para viajar?</SectionTag>
          <h2 className="font-plus-jakarta text-3xl font-extrabold leading-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
            {d.cta_titulo ?? `Viaja a ${d.nombre}`}
          </h2>
          {d.cta_subtitulo && (
            <p className="mx-auto mt-4 max-w-lg font-inter text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-dim)' }}>
              {d.cta_subtitulo}
            </p>
          )}
          {d.precio_desde && (
            <p className="mt-3 font-plus-jakarta text-lg font-bold" style={{ color: 'var(--orange)' }}>Desde {d.precio_desde}</p>
          )}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="whatsapp" href={waUrl}>Cotizar por WhatsApp</Button>
            <Button variant="outline" href="/destinos">Ver otros destinos</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
