'use client'

import { useTransition } from 'react'
import { Check, X } from 'lucide-react'
import { aprobarUsuario, revocarUsuario } from './actions'

const btn = 'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-inter text-xs disabled:opacity-50'

/** Botón para aprobar un correo pendiente. */
export function AprobarBtn({ email }: { email: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => aprobarUsuario(email))}
      className={btn}
      style={{ background: 'var(--orange)', color: '#fff' }}
    >
      <Check size={14} />
      {pending ? 'Aprobando…' : 'Aprobar'}
    </button>
  )
}

/** Botón para revocar el acceso de un correo aprobado. */
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
