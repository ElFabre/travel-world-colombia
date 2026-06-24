import type { Metadata } from 'next'
import { getAdminUser } from '@/lib/admin/guard'
import { Sidebar } from './_components/Sidebar'

export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // En /admin/login y /admin/registro no hay sesión aprobada → sin chrome.
  const user = await getAdminUser()

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: '#f4f7fb' }}>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    )
  }

  return (
    <div className="tema-claro min-h-screen" style={{ background: 'var(--bg-alt)' }}>
      <Sidebar email={user.email ?? ''} />
      <div className="md:pl-60">
        {/* Marca de agua tenue del logo en el fondo */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 md:left-60"
          style={{
            zIndex: 0,
            backgroundImage: 'url(/images/travel-world-colombia-logo.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'min(900px, 85%) auto',
            opacity: 0.14,
            filter: 'grayscale(0) saturate(1.3)',
          }}
        />
        <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
