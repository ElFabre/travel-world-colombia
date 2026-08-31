import type { ReactNode } from 'react'
import { SectionTag } from '@/components/ui/SectionTag'

/* ─────────── Armazón compartido de las páginas legales ───────────
 * Hero corto (tema oscuro) + columna de lectura. El contenido usa los
 * helpers tipográficos de abajo para mantener una sola voz visual. */

interface LegalShellProps {
  tag: string
  titulo: ReactNode
  intro?: string
  children: ReactNode
}

export function LegalShell({ tag, titulo, intro, children }: LegalShellProps) {
  return (
    <div className="tema-claro">
      {/* ── Hero strip ── */}
      <section
        className="tema-oscuro relative overflow-hidden pt-32 pb-14 px-6"
        style={{ background: 'linear-gradient(to bottom, rgba(13, 30, 60,0.98), var(--navy))' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-3xl">
          <SectionTag className="mb-4">{tag}</SectionTag>
          <h1
            className="font-plus-jakarta text-3xl font-extrabold leading-tight sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {titulo}
          </h1>
          {intro && (
            <p
              className="mt-4 max-w-2xl font-inter text-sm leading-relaxed sm:text-base"
              style={{ color: 'var(--text-dim)' }}
            >
              {intro}
            </p>
          )}
        </div>
      </section>

      {/* ── Contenido ── */}
      <section className="px-6 py-14" style={{ background: 'var(--bg)' }}>
        <div className="mx-auto max-w-3xl">{children}</div>
      </section>
    </div>
  )
}

/* ─────────── Helpers tipográficos ─────────── */

export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2
      className="mt-10 mb-3 font-plus-jakarta text-xl font-bold first:mt-0"
      style={{ color: 'var(--text-primary)' }}
    >
      {children}
    </h2>
  )
}

export function LegalP({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-4 font-inter text-[15px] leading-relaxed"
      style={{ color: 'var(--text-dim)' }}
    >
      {children}
    </p>
  )
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mb-4 space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-2.5 font-inter text-[15px] leading-relaxed"
          style={{ color: 'var(--text-dim)' }}
        >
          <span aria-hidden className="mt-[2px] shrink-0" style={{ color: 'var(--orange)' }}>
            ✦
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Bloque destacado — avisos que la ley pide dar de forma visible (p. ej. ESCNNA). */
export function LegalAviso({ children }: { children: ReactNode }) {
  return (
    <div
      className="my-6 rounded-sm border-l-2 px-5 py-4 font-inter text-[14px] leading-relaxed"
      style={{
        borderColor: 'var(--orange)',
        background: 'var(--bg-subtle, rgba(0,0,0,0.03))',
        color: 'var(--text-dim)',
      }}
    >
      {children}
    </div>
  )
}
