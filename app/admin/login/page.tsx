'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn, type LoginState } from '../actions'

const initial: LoginState = {}

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, initial)

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        action={action}
        className="w-full max-w-sm rounded-xl p-8"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <h1 className="mb-1 font-plus-jakarta text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Panel de administración
        </h1>
        <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          Travel World Colombia
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
          autoComplete="current-password"
          required
          className="mb-6 w-full rounded-md px-3 py-2 font-inter text-sm outline-none"
          style={{ background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />

        {state.error && (
          <p className="mb-4 font-inter text-xs" style={{ color: '#ef4444' }}>{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md px-4 py-2.5 font-plus-jakarta text-sm font-bold uppercase tracking-wide"
          style={{ background: 'var(--orange)', color: '#fff', opacity: pending ? 0.6 : 1 }}
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-5 text-center font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/admin/registro" style={{ color: 'var(--orange)' }}>Crear cuenta</Link>
        </p>
      </form>
    </div>
  )
}
