import { ArrowRight } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { Button } from '@/components/ui/Button'
import { whatsappUrl } from '@/lib/site'
import { initials } from '@/lib/hero'

interface HeroContentProps {
  destino: Destino
}

/** Contenido textual del hero — kana, título, frase, autor y CTAs. */
export function HeroContent({ destino }: HeroContentProps) {
  return (
    <div
      // key remount en el padre dispara este fadeUp en cada cambio de destino
      style={{ animation: 'fadeUp 0.35s ease both' }}
      className="relative z-10 flex max-w-[580px] flex-1 flex-col justify-center px-6"
    >
      {destino.nombre_local && (
        <p
          className="mb-1.5 font-inter text-[12px] font-light tracking-[0.4em] text-gold opacity-85"
        >
          {destino.nombre_local}
        </p>
      )}

      <h1
        className="uppercase"
        style={{
          fontFamily: 'var(--font-plus-jakarta)',
          fontWeight: 800,
          fontSize: 'clamp(52px, 12vw, 100px)',
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: 'var(--white)',
          textShadow: '0 2px 24px rgba(6,14,26,0.55)',
        }}
      >
        {destino.nombre}
      </h1>

      <div
        className="my-[18px] h-0.5 w-11 rounded-sm"
        style={{ background: 'linear-gradient(to right, var(--orange), var(--gold))' }}
      />

      {destino.frase_hero && (
        <p
          className="max-w-[330px] font-inter font-light"
          style={{ fontSize: 'clamp(11px, 2.8vw, 13px)', lineHeight: 1.8, color: 'var(--text-dim)', textShadow: '0 1px 12px rgba(6,14,26,0.6)' }}
        >
          {destino.frase_hero}
        </p>
      )}

      {(destino.autor_frase || destino.cargo_autor) && (
        <div className="mt-4 flex items-center gap-2.5">
          <div
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, var(--orange), var(--gold))',
              border: '2px solid rgba(244,130,31,.4)',
            }}
          >
            {initials(destino.autor_frase)}
          </div>
          <div>
            {destino.autor_frase && (
              <div className="font-cinzel text-[10px] tracking-[0.2em] text-white">
                {destino.autor_frase}
              </div>
            )}
            {destino.cargo_autor && (
              <div className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-dim)' }}>
                {destino.cargo_autor}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button href={`/destinos/${destino.slug}`} size="sm">
          Ver destino <ArrowRight size={13} />
        </Button>
        <Button
          href={whatsappUrl(destino.nombre)}
          variant="outline"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cotizar por WhatsApp
        </Button>
      </div>
    </div>
  )
}
