'use client'

import { useEffect, useRef, useState } from 'react'
import { Plane, Sparkles, MapPin, Star, ArrowRight, Zap } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   Laboratorio de motion — variantes "rendimiento primero".
   Todo sin dependencias: CSS + IntersectionObserver + SVG.
   Respeta prefers-reduced-motion. Aislado en app/lab/.
   ───────────────────────────────────────────────────────────── */

/** Revela el hijo al entrar en pantalla (una sola vez). */
function Reveal({
  children,
  delay = 0,
  variant = 'up',
}: {
  children: React.ReactNode
  delay?: number
  variant?: 'up' | 'left' | 'zoom'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setShown(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal={variant}
      data-shown={shown}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Contador que sube de 0 al valor cuando entra en pantalla. */
function CountUp({ to, suffix = '', duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setVal(to); return }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(to * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return <span ref={ref}>{val.toLocaleString('es-CO')}{suffix}</span>
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-inter text-[11px] font-bold"
      style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}
    >
      <Zap size={11} /> {children}
    </span>
  )
}

function Seccion({
  n, titulo, costo, children,
}: { n: number; titulo: string; costo: string; children: React.ReactNode }) {
  return (
    <section className="border-t px-6 py-16" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full font-plus-jakarta text-sm font-bold"
            style={{ background: 'rgba(244,130,31,0.12)', color: 'var(--orange)' }}
          >
            {n}
          </span>
          <h2 className="font-plus-jakarta text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {titulo}
          </h2>
          <Badge>{costo}</Badge>
        </div>
        {children}
      </div>
    </section>
  )
}

export function MotionLab() {
  return (
    <div className="tema-claro" style={{ background: 'var(--card-bg)' }}>
      <style>{css}</style>

      {/* ── Encabezado ── */}
      <header className="px-6 pt-32 pb-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 font-cinzel text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--orange)' }}>
            Página de pruebas · no indexada
          </p>
          <h1 className="font-plus-jakarta text-4xl font-extrabold sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
            Laboratorio de Motion
          </h1>
          <p className="mt-4 max-w-2xl font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Variantes de movimiento para evaluar antes de aplicarlas al sitio. Todo lo de abajo es
            <strong style={{ color: 'var(--text-primary)' }}> sin librerías</strong> (CSS + SVG),
            así que el costo en rendimiento es mínimo. Dime cuáles te gustan y las llevo a las páginas
            reales; las que no, se borran con la carpeta.
          </p>
        </div>
      </header>

      {/* 1 ── Reveals al hacer scroll ── */}
      <Seccion n={1} titulo="Reveals al hacer scroll" costo="Costo casi nulo">
        <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          Los elementos aparecen al entrar en pantalla. Baja despacio para verlos activarse.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: MapPin, t: 'Destinos', d: 'Las tarjetas suben y aparecen en secuencia.' },
            { Icon: Star, t: 'Reseñas', d: 'Aparición suave con un leve retardo.' },
            { Icon: Plane, t: 'Paquetes', d: 'Stagger: cada tarjeta entra después de la anterior.' },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 140}>
              <div className="rounded-xl p-6" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                <c.Icon size={22} style={{ color: 'var(--orange)' }} />
                <h3 className="mt-3 font-plus-jakarta text-base font-bold" style={{ color: 'var(--text-primary)' }}>{c.t}</h3>
                <p className="mt-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Reveal variant="left">
            <div className="rounded-xl p-6" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <p className="font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Deslizar desde la izquierda</p>
              <p className="mt-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>Ideal para bloques de texto + imagen.</p>
            </div>
          </Reveal>
          <Reveal variant="zoom">
            <div className="rounded-xl p-6" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <p className="font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Aparecer con zoom</p>
              <p className="mt-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>Para destacar una imagen o un CTA.</p>
            </div>
          </Reveal>
        </div>
      </Seccion>

      {/* 2 ── Microinteracciones ── */}
      <Seccion n={2} titulo="Microinteracciones (hover / toque)" costo="Costo casi nulo">
        <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          Pasa el mouse (o toca en móvil) sobre cada elemento.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Botón con brillo */}
          <button className="lab-btn-shine rounded-md px-5 py-3 font-plus-jakarta text-sm font-bold text-white" style={{ background: 'var(--orange)' }}>
            Botón con brillo
          </button>
          {/* Botón con flecha */}
          <button className="lab-btn-arrow flex items-center justify-center gap-2 rounded-md px-5 py-3 font-plus-jakarta text-sm font-bold" style={{ border: '1px solid var(--border-orange)', color: 'var(--orange)' }}>
            Ver más <ArrowRight size={16} className="lab-arrow" />
          </button>
          {/* Enlace con subrayado animado */}
          <a className="lab-underline self-center justify-self-center font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Enlace subrayado
          </a>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="lab-card-lift rounded-xl p-6" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <Sparkles size={20} style={{ color: 'var(--orange)' }} className="lab-card-icon" />
              <p className="mt-3 font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Tarjeta que se eleva</p>
              <p className="mt-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>Sube y el ícono reacciona.</p>
            </div>
          ))}
        </div>
      </Seccion>

      {/* 3 ── Contadores ── */}
      <Seccion n={3} titulo="Cifras que cuentan al aparecer" costo="Costo casi nulo">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[
            { to: 126, suf: '+', l: 'reseñas 5★' },
            { to: 8, suf: '+', l: 'destinos' },
            { to: 5, suf: '+', l: 'años' },
            { to: 24, suf: 'h', l: 'respuesta' },
          ].map(c => (
            <div key={c.l} className="rounded-xl p-6 text-center" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <p className="font-plus-jakarta text-4xl font-extrabold" style={{ color: 'var(--orange)' }}>
                <CountUp to={c.to} suffix={c.suf} />
              </p>
              <p className="mt-1 font-cinzel text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--text-muted)' }}>{c.l}</p>
            </div>
          ))}
        </div>
      </Seccion>

      {/* 4 ── Motion graphic SVG: ruta de vuelo ── */}
      <Seccion n={4} titulo="Motion graphic en SVG: ruta de vuelo" costo="Sin librerías">
        <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          Animación vectorial 100% propia (alternativa liviana a Lottie). El avión recorre la ruta,
          la línea se dibuja y los puntos laten.
        </p>
        <div className="overflow-hidden rounded-xl" style={{ background: 'var(--navy)', border: '1px solid var(--border)' }}>
          <svg viewBox="0 0 800 300" className="h-auto w-full" role="img" aria-label="Avión recorriendo una ruta entre dos ciudades">
            {/* puntos origen/destino */}
            <g>
              <circle cx="120" cy="220" r="6" fill="#f4821f" className="lab-pulse" />
              <circle cx="680" cy="90" r="6" fill="#f4821f" className="lab-pulse" style={{ animationDelay: '0.6s' }} />
              <text x="120" y="250" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle" fontFamily="Inter, sans-serif">Fusagasugá</text>
              <text x="680" y="70" fill="rgba(255,255,255,0.7)" fontSize="13" textAnchor="middle" fontFamily="Inter, sans-serif">El mundo</text>
            </g>
            {/* ruta */}
            <path
              id="lab-route"
              d="M120,220 C300,40 520,40 680,90"
              fill="none"
              stroke="rgba(244,130,31,0.55)"
              strokeWidth="2.5"
              strokeDasharray="6 8"
              className="lab-route-draw"
            />
            {/* avión recorriendo la ruta */}
            <g className="lab-plane">
              <g transform="translate(-10,-10)">
                <path d="M2 10 L18 3 L13 10 L18 17 Z" fill="#fff" />
              </g>
              <animateMotion dur="4s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                <mpath href="#lab-route" />
              </animateMotion>
            </g>
          </svg>
        </div>
        <p className="mt-3 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
          Se puede adaptar a tu marca (colores, ciudades reales, varios destinos). Ideal para el héroe o “cómo funciona”.
        </p>
      </Seccion>

      {/* 5 ── Lottie (requiere librería) ── */}
      <Seccion n={5} titulo="Lottie (animación de diseñador)" costo="Requiere librería">
        <div className="rounded-xl p-6" style={{ background: 'rgba(244,130,31,0.05)', border: '1px solid var(--border-orange)' }}>
          <p className="font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Lottie reproduce animaciones hechas en After Effects (avión volando una ruta ilustrada,
            íconos animados, escenas). Es lo más “motion graphics” de verdad, pero suma una librería
            (~30–60 KB) y un archivo por animación. Por tu prioridad de <strong style={{ color: 'var(--text-primary)' }}>rendimiento primero</strong> lo dejé
            sin instalar.
          </p>
          <p className="mt-3 font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Si te gusta el concepto, elige una animación en <strong style={{ color: 'var(--text-primary)' }}>lottiefiles.com</strong> (o
            mándame el archivo) y la integro aquí mismo —cargada en diferido y respetando “reducir movimiento”—
            para que la compares con la opción SVG de arriba.
          </p>
        </div>
      </Seccion>

      <div className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-xl p-6 text-center" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
          <p className="font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
            ¿Cuáles te gustan? Dime los números y las aplico a las páginas reales. Esta página
            (<code>/lab</code>) no está enlazada ni indexada; se elimina borrando <code>app/lab/</code>.
          </p>
        </div>
      </div>
    </div>
  )
}

const css = `
[data-reveal] { opacity: 0; transition: opacity .7s ease, transform .7s ease; will-change: opacity, transform; }
[data-reveal="up"]   { transform: translateY(28px); }
[data-reveal="left"] { transform: translateX(-32px); }
[data-reveal="zoom"] { transform: scale(.94); }
[data-reveal][data-shown="true"] { opacity: 1; transform: none; }

.lab-btn-shine { position: relative; overflow: hidden; transition: transform .2s ease; }
.lab-btn-shine:hover { transform: translateY(-2px); }
.lab-btn-shine::after { content: ""; position: absolute; inset: 0; transform: translateX(-120%); background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%); transition: transform .6s ease; }
.lab-btn-shine:hover::after { transform: translateX(120%); }

.lab-btn-arrow { transition: background .2s ease; }
.lab-btn-arrow:hover { background: rgba(244,130,31,0.08); }
.lab-arrow { transition: transform .2s ease; }
.lab-btn-arrow:hover .lab-arrow { transform: translateX(4px); }

.lab-underline { position: relative; cursor: pointer; }
.lab-underline::after { content: ""; position: absolute; left: 0; bottom: -4px; height: 2px; width: 100%; background: var(--orange); transform: scaleX(0); transform-origin: left; transition: transform .3s ease; }
.lab-underline:hover::after { transform: scaleX(1); }

.lab-card-lift { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.lab-card-lift:hover { transform: translateY(-6px); box-shadow: 0 12px 28px rgba(10,22,40,.12); border-color: var(--border-orange); }
.lab-card-icon { transition: transform .25s ease; }
.lab-card-lift:hover .lab-card-icon { transform: rotate(-8deg) scale(1.15); }

@keyframes labPulse { 0%,100% { opacity: 1; r: 6; } 50% { opacity: .45; r: 9; } }
.lab-pulse { animation: labPulse 2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

@keyframes labDraw { to { stroke-dashoffset: 0; } }
.lab-route-draw { stroke-dashoffset: 600; animation: labDraw 3s ease forwards; }

@media (prefers-reduced-motion: reduce) {
  .lab-route-draw { stroke-dashoffset: 0; animation: none; }
  .lab-pulse { animation: none; }
  .lab-plane { display: none; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
`
