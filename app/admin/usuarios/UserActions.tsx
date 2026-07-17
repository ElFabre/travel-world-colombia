'use client'

import { useTransition } from 'react'
import { Check, X } from 'lucide-react'
import { aprobarUsuario, revocarUsuario, cambiarRol } from './actions'
import { ROLES, ROLE_LABEL, type Role } from '@/lib/admin/allowlist'

const btn = 'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-inter text-xs disabled:opacity-50'

/** Selector de rol de un usuario aprobado. */
export function RoleSelect({
  email, rol, puedeAdmin, disabled,
}: { email: string; rol: Role; puedeAdmin: boolean; disabled?: boolean }) {
  const [pending, start] = useTransition()
  return (
    <select
      value={rol}
      disabled={disabled || pending}
      onChange={e => start(() => cambiarRol(email, e.target.value as Role))}
      className="rounded-md px-2 py-1.5 font-inter text-xs disabled:opacity-50"
      style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
    >
      {ROLES.map(r => (
        <option key={r} value={r} disabled={r === 'admin' && !puedeAdmin}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  )
}

/** Botón para aprobar un correo pendiente (entra como editor). */
export function AprobarBtn({ email }: { email: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => aprobarUsuario(email))}
      className={btn}
      style={{ background: 'var(--orange)', color: 'var(--orange-contrast)' }}
    >
      <Check size={14} />
      {pending ? 'Aprobando…' : 'Aprobar'}
    </button>
  )
}

/** Botón para revocar el acceso de un correo aprobado (solo admin). */
export function RevocarBtn({ email }: { email: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`¿Revocar el acceso de ${email}?`)) start(() => revocarUsuario(email))
      }}
      className={btn}
      style={{ color: '#ef4444', border: '1px solid var(--border)' }}
    >
      <X size={14} />
      {pending ? 'Revocando…' : 'Revocar'}
    </button>
  )
}
