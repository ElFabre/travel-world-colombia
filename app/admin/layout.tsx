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
      <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      <Sidebar email={user.email ?? ''} />
      <div className="md:pl-60">
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
