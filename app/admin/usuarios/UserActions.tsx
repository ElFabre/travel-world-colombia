'use client'

import { useActionState, useState, useTransition } from 'react'
import { Check, X, Send, Pencil } from 'lucide-react'
import { aprobarUsuario, revocarUsuario, cambiarRol, cambiarNombre, invitarUsuario, type InviteState } from './actions'
import { ROLES, ROLE_LABEL, type Role } from '@/lib/admin/allowlist'

const btn = 'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-inter text-xs disabled:opacity-50'

/** Formulario de invitación: única vía de alta con el signup público apagado. */
export function InvitarForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(invitarUsuario, {})
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          maxLength={80}
          className="min-w-0 flex-1 rounded-md px-3 py-1.5 font-inter text-sm outline-none"
          style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
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

/**
 * Nombre del usuario, editable en línea (lápiz → input → Enter/Escape).
 * Si no hay nombre aún, muestra el correo como título.
 */
export function NombreEditable({ email, nombre, puedeEditar }: { email: string; nombre: string | null; puedeEditar: boolean }) {
  const [editando, setEditando] = useState(false)
  const [pending, start] = useTransition()

  if (editando) {
    return (
      <form
        className="flex items-center gap-1.5"
        onSubmit={e => {
          e.preventDefault()
          const valor = String(new FormData(e.currentTarget).get('nombre') ?? '')
          start(async () => {
            await cambiarNombre(email, valor)
            setEditando(false)
          })
        }}
      >
        <input
          name="nombre"
          defaultValue={nombre ?? ''}
          placeholder="Nombre"
          maxLength={80}
          autoFocus
          disabled={pending}
          onKeyDown={e => { if (e.key === 'Escape') setEditando(false) }}
          className="min-w-0 rounded-md px-2 py-1 font-inter text-sm outline-none disabled:opacity-50"
          style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <button type="submit" disabled={pending} className="disabled:opacity-50" style={{ color: 'var(--orange)' }} aria-label="Guardar nombre">
          <Check size={14} />
        </button>
      </form>
    )
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-inter text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {nombre ?? email}
      </span>
      {puedeEditar && (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="shrink-0 opacity-60 hover:opacity-100"
          style={{ color: 'var(--text-muted)' }}
          aria-label={`Editar nombre de ${email}`}
        >
          <Pencil size={12} />
        </button>
      )}
    </span>
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
