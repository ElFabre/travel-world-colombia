'use client'

import { useActionState, useTransition } from 'react'
import { Check, X, Send } from 'lucide-react'
import { aprobarUsuario, revocarUsuario, cambiarRol, invitarUsuario, type InviteState } from './actions'
import { ROLES, ROLE_LABEL, type Role } from '@/lib/admin/allowlist'

const btn = 'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-inter text-xs disabled:opacity-50'

/** Formulario de invitación: única vía de alta con el signup público apagado. */
export function InvitarForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(invitarUsuario, {})
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="correo@ejemplo.com"
          className="min-w-0 flex-1 rounded-md px-3 py-1.5 font-inter text-sm outline-none"
          style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <select
          name="rol"
          defaultValue="editor"
          className="rounded-md px-2 py-1.5 font-inter text-xs"
          style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className={btn}
          style={{ background: 'var(--orange)', color: 'var(--orange-contrast)' }}
        >
          <Send size={14} />
          {pending ? 'Enviando…' : 'Invitar'}
        </button>
      </div>
      {state.error && <p className="font-inter text-xs" style={{ color: '#ef4444' }}>{state.error}</p>}
      {state.ok && <p className="font-inter text-xs" style={{ color: 'var(--text-dim)' }}>{state.ok}</p>}
    </form>
  )
}

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
