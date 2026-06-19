import type { Metadata } from 'next'
import Link from 'next/link'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { getAdminUser } from '@/lib/admin/guard'
import { signOut } from './actions'

export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // En /admin/login no hay sesión todavía → no mostramos el chrome.
  const user = await getAdminUser()

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      {user && (
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
          style={{ background: 'rgba(6,14,26,0.9)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
        >
          <Link href="/admin" className="flex items-center gap-2 font-plus-jakarta font-bold" style={{ color: 'var(--text-primary)' }}>
            <LayoutDashboard size={18} style={{ color: 'var(--orange)' }} />
            Panel · Travel World
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-inter text-xs sm:inline" style={{ color: 'var(--text-dim)' }}>
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-inter text-xs"
                style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}
              >
                <LogOut size={14} />
                Salir
              </button>
            </form>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
