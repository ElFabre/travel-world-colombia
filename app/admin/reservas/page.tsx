import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import { Buscador } from './Buscador'

export const metadata: Metadata = { title: 'Reservas · Panel' }
export const dynamic = 'force-dynamic'

export default async function ReservasPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (session.rol === 'lector') redirect('/admin')

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-playfair text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Reservas
        </h1>
        <p className="mt-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          Busca al cliente, elige su oportunidad y llena los datos de la venta paso a paso.
          Todo se guarda directo en la oportunidad de GHL.
        </p>
      </header>

      <Buscador />
    </div>
  )
}
