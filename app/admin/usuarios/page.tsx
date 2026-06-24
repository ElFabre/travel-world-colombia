import { redirect } from 'next/navigation'
import { ShieldCheck, Clock, UserCheck } from 'lucide-react'
import { getAdminUser } from '@/lib/admin/guard'
import { superadmins } from '@/lib/admin/allowlist'
import { createAdminClient } from '@/lib/supabase/admin'
import { AprobarBtn, RevocarBtn } from './UserActions'

export const dynamic = 'force-dynamic'

const fmtFecha = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

export default async function UsuariosPage() {
  const user = await getAdminUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()
  const [{ data: aprobados }, { data: usersData }] = await Promise.all([
    admin.from('admin_allowlist').select('email, aprobado_por, created_at').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers(),
  ])

  const supers = superadmins()
  const aprobadosEmails = new Set((aprobados ?? []).map(a => a.email.toLowerCase()))
  const registrados = usersData?.users ?? []

  // Pendientes: se registraron pero no son superadmin ni están aprobados.
  const pendientes = registrados.filter(u => {
    const e = (u.email ?? '').toLowerCase()
    return e && !supers.includes(e) && !aprobadosEmails.has(e)
  })

  return (
    <>
      <div className="mb-8">
        <h1 className="font-plus-jakarta text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Usuarios
        </h1>
        <p className="mt-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          Aprueba quién puede entrar al panel · los cambios aplican de inmediato
        </p>
      </div>

      {/* ── Pendientes de aprobación ── */}
      <Seccion icon={<Clock size={16} />} titulo="Pendientes de aprobación" n={pendientes.length}>
        {pendientes.length === 0 ? (
          <Vacio>Nadie pendiente. Cuando alguien se registre en /admin/registro aparecerá aquí.</Vacio>
        ) : (
          pendientes.map(u => (
            <Fila key={u.id} email={u.email ?? '—'} sub={
              <>Registrado el {fmtFecha.format(new Date(u.created_at))}
                {!u.email_confirmed_at ? <span style={{ color: '#f59e0b' }}> · sin confirmar correo</span> : null}
              </>
            }>
              <AprobarBtn email={u.email ?? ''} />
            </Fila>
          ))
        )}
      </Seccion>

      {/* ── Aprobados desde el panel ── */}
      <Seccion icon={<UserCheck size={16} />} titulo="Aprobados" n={(aprobados ?? []).length}>
        {(aprobados ?? []).length === 0 ? (
          <Vacio>Aún no has aprobado a nadie desde el panel.</Vacio>
        ) : (
          (aprobados ?? []).map(a => (
            <Fila
              key={a.email}
              email={a.email}
              sub={<>Aprobado por {a.aprobado_por ?? '—'} · {fmtFecha.format(new Date(a.created_at))}</>}
            >
              <RevocarBtn email={a.email} />
            </Fila>
          ))
        )}
      </Seccion>

      {/* ── Superadmins (env) ── */}
      <Seccion icon={<ShieldCheck size={16} />} titulo="Superadmins (fijos)" n={supers.length}>
        {supers.map(e => (
          <Fila key={e} email={e} sub="Definido en ADMIN_EMAILS · no se puede revocar aquí">
            <span className="font-inter text-xs" style={{ color: 'var(--text-muted)' }}>Permanente</span>
          </Fila>
        ))}
      </Seccion>
    </>
  )
}

function Seccion({ icon, titulo, n, children }: { icon: React.ReactNode; titulo: string; n: number; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        <span style={{ color: 'var(--orange)' }}>{icon}</span>
        {titulo}
        <span className="rounded-full px-2 py-0.5 font-inter text-xs" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>{n}</span>
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

function Fila({ email, sub, children }: { email: string; sub: React.ReactNode; children: React.ReactNode }) {
  return (
    <li
      className="flex items-center gap-4 rounded-lg p-3"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-inter text-sm" style={{ color: 'var(--text-primary)' }}>{email}</p>
        <p className="truncate font-inter text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  )
}

function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-md p-6 text-center font-inter text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
      {children}
    </li>
  )
}
