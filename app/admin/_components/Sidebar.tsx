'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Plane, Inbox, Star, Users, Activity, LogOut, Menu, X,
} from 'lucide-react'
import { signOut } from '../actions'

const NAV = [
  { href: '/admin',             label: 'Dashboard',    Icon: LayoutDashboard, exact: true },
  { href: '/admin/viajes',      label: 'Viajes',       Icon: Plane },
  { href: '/admin/solicitudes', label: 'Solicitudes',  Icon: Inbox },
  { href: '/admin/resenas',     label: 'Reseñas',      Icon: Star },
  { href: '/admin/usuarios',    label: 'Usuarios',     Icon: Users },
  { href: '/admin/actividad',   label: 'Actividad',    Icon: Activity },
]

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const esActiva = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const Contenido = (
    <div className="flex h-full flex-col">
      <Link
        href="/admin"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 px-5 py-4 font-plus-jakarta font-bold"
        style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
      >
        <LayoutDashboard size={18} style={{ color: 'var(--orange)' }} />
        Travel World
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon, exact }) => {
            const activa = esActiva(href, exact)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 font-inter text-sm transition-colors"
                  style={{
                    background: activa ? 'var(--orange)' : 'transparent',
                    color: activa ? '#fff' : 'var(--text-dim)',
                    fontWeight: activa ? 600 : 400,
                  }}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="mb-2 truncate font-inter text-xs" style={{ color: 'var(--text-muted)' }}>{email}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-inter text-xs"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Barra superior móvil */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden"
        style={{ background: 'rgba(6,14,26,0.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
      >
        <Link href="/admin" className="flex items-center gap-2 font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          <LayoutDashboard size={16} style={{ color: 'var(--orange)' }} />
          Travel World
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-md"
          style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Sidebar fijo (desktop) */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-60 md:block"
        style={{ background: 'rgba(6,14,26,0.95)', borderRight: '1px solid var(--border)' }}
      >
        {Contenido}
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpen(false)} />
          <aside
            className="absolute inset-y-0 left-0 w-64"
            style={{ background: 'var(--navy)', borderRight: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md"
              style={{ color: 'var(--text-dim)' }}
            >
              <X size={18} />
            </button>
            {Contenido}
          </aside>
        </div>
      )}
    </>
  )
}
