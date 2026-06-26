'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { NAV_LINKS, SITE } from '@/lib/site'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 transition-all duration-300"
      style={{
        background: scrolled || open ? 'var(--dark)' : 'transparent',
        backdropFilter: scrolled || open ? 'blur(10px)' : 'none',
        borderBottom: scrolled || open ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
      >
        <Link href="/" aria-label={`${SITE.nombre} — Inicio`} className="relative z-50">
          <Image
            src="/images/travel-world-colombia-logo.png"
            alt={SITE.nombre}
            width={160}
            height={40}
            priority
            className="h-9 w-auto"
          />
        </Link>

        {/* Links desktop */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-plus-jakarta text-[11px] font-bold tracking-[0.15em] uppercase transition-colors hover:text-orange"
                style={{ color: 'var(--text-primary)' }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Button href="/contacto" size="sm">Cotizar ahora</Button>
        </div>

        {/* Hamburger móvil */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className="relative z-50 md:hidden"
          style={{ color: 'var(--text-primary)' }}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Menú móvil */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden"
          style={{ background: 'var(--overlay)', borderTop: '1px solid var(--border)' }}
        >
          <ul className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-plus-jakarta text-[12px] font-bold tracking-[0.15em] uppercase transition-colors hover:text-orange"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Button href="/contacto" size="sm" className="w-full" onClick={() => setOpen(false)}>
                Cotizar ahora
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
