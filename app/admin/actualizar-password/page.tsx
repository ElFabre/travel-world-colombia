'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { actualizarPassword, type ResetState } from '../actions'

const initial: ResetState = {}

const labelStyle = { color: 'rgba(255,255,255,0.7)' } as const
const inputStyle = { background: '#fff', border: '1px solid rgba(255,255,255,0.18)', color: '#0d1e3c' } as const

export default function ActualizarPasswordPage() {
  const [state, action, pending] = useActionState(actualizarPassword, initial)

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        action={action}
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: '#16315f', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 30px 60px -24px rgba(13, 30, 60,0.45)' }}
      >
        <h1 className="mb-1 font-plus-jakarta text-2xl font-extrabold" style={{ color: '#fff' }}>
          Nueva contraseña
        </h1>
        <p className="mb-6 font-inter text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Escribe tu nueva contraseña para el panel.
        </p>

        <label className="mb-1 block font-inter text-xs" style={labelStyle}>Contraseña</label>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mb-4 w-full rounded-md px-3 py-2 font-inter text-sm outline-none"
          style={inputStyle}
        />

        <label className="mb-1 block font-inter text-xs" style={labelStyle}>Repetir contraseña</label>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mb-6 w-full rounded-md px-3 py-2 font-inter text-sm outline-none"
          style={inputStyle}
        />

        {state.error && (
          <p className="mb-4 font-inter text-xs" style={{ color: '#fca5a5' }}>{state.error}</p>
        )}
        {state.ok && (
          <p className="mb-4 rounded-md p-3 font-inter text-xs" style={{ background: 'rgba(74,222,128,0.12)', color: '#86efac' }}>
            {state.ok}
          </p>
        )}

        {state.ok ? (
          <Link
            href="/admin/login"
            className="block w-full rounded-md px-4 py-2.5 text-center font-plus-jakarta text-sm font-bold uppercase tracking-wide"
            style={{ background: 'var(--orange)', color: 'var(--orange-contrast)' }}
          >
            Iniciar sesión
          </Link>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md px-4 py-2.5 font-plus-jakarta text-sm font-bold uppercase tracking-wide"
            style={{ background: 'var(--orange)', color: 'var(--orange-contrast)', opacity: pending ? 0.6 : 1 }}
          >
            {pending ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        )}
      </form>
    </div>
  )
}
