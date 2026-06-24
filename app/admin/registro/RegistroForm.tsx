'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type RegisterState } from '../actions'

const initial: RegisterState = {}

export default function RegistroForm() {
  const [state, action, pending] = useActionState(signUp, initial)

  return (
    <form
      action={action}
      className="w-full max-w-sm rounded-xl p-8"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <h1 className="mb-1 font-plus-jakarta text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
        Crear cuenta
      </h1>
      <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
        Acceso al panel de Travel World Colombia
      </p>

      <label className="mb-1 block font-inter text-xs" style={{ color: 'var(--text-dim)' }}>Email</label>
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        className="mb-4 w-full rounded-md px-3 py-2 font-inter text-sm outline-none"
        style={{ background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />

      <label className="mb-1 block font-inter text-xs" style={{ color: 'var(--text-dim)' }}>Contraseña</label>
      <input
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        className="mb-4 w-full rounded-md px-3 py-2 font-inter text-sm outline-none"
        style={{ background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />

      <label className="mb-1 block font-inter text-xs" style={{ color: 'var(--text-dim)' }}>Repetir contraseña</label>
      <input
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        className="mb-6 w-full rounded-md px-3 py-2 font-inter text-sm outline-none"
        style={{ background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />

      {state.error && (
        <p className="mb-4 font-inter text-xs" style={{ color: '#ef4444' }}>{state.error}</p>
      )}
      {state.ok && (
        <p className="mb-4 rounded-md p-3 font-inter text-xs" style={{ background: 'rgba(74,222,128,0.1)', color: '#86efac' }}>
          {state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || Boolean(state.ok)}
        className="w-full rounded-md px-4 py-2.5 font-plus-jakarta text-sm font-bold uppercase tracking-wide"
        style={{ background: 'var(--orange)', color: '#fff', opacity: pending || state.ok ? 0.6 : 1 }}
      >
        {pending ? 'Creando…' : 'Crear cuenta'}
      </button>

      <p className="mt-5 text-center font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/admin/login" style={{ color: 'var(--orange)' }}>Inicia sesión</Link>
      </p>
    </form>
  )
}
