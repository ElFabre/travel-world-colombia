import { redirect } from 'next/navigation'
import { Clock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isApprovedEmail } from '@/lib/admin/allowlist'
import { signOut } from '../actions'
import RegistroForm from './RegistroForm'

export const dynamic = 'force-dynamic'

export default async function RegistroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Ya autenticado y aprobado → directo al panel.
  if (user && (await isApprovedEmail(user.email))) redirect('/admin')

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      {user ? (
        // Autenticado pero fuera de la allowlist → pendiente de aprobación.
        <div
          className="w-full max-w-sm rounded-xl p-8 text-center"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--orange)' }}
          >
            <Clock size={22} />
          </div>
          <h1 className="mb-2 font-plus-jakarta text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Pendiente de aprobación
          </h1>
          <p className="mb-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
            Tu cuenta <span style={{ color: 'var(--text-primary)' }}>{user.email}</span> fue creada,
            pero aún no tiene acceso al panel.
          </p>
          <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
            El administrador debe aprobar tu correo. Vuelve a intentar más tarde.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 font-inter text-xs"
              style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : (
        <RegistroForm />
      )}
    </div>
  )
}
