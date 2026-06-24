'use client'

import { useActionState, useEffect, useRef } from 'react'
import { crearResena, type ResenaState } from './actions'

const initial: ResenaState = {}
const input = 'w-full rounded-md px-3 py-2 font-inter text-sm outline-none'
const inputStyle = { background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const

export function ResenaForm() {
  const [state, action, pending] = useActionState(crearResena, initial)
  const formRef = useRef<HTMLFormElement>(null)

  // Limpia el formulario tras crear con éxito.
  useEffect(() => { if (state.ok) formRef.current?.reset() }, [state.ok])

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-8 rounded-xl p-5"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <h2 className="mb-4 font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        Nueva reseña
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="nombre" required placeholder="Nombre del cliente" className={input} style={inputStyle} />
        <input name="destino" placeholder="Destino (opcional)" className={input} style={inputStyle} />
      </div>

      <textarea name="texto" required rows={3} placeholder="Testimonio…" className={`${input} mt-3`} style={inputStyle} />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
          Estrellas
          <select name="estrellas" defaultValue="5" className="rounded-md px-2 py-1.5 font-inter text-sm" style={inputStyle}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
          Fuente
          <select name="fuente" defaultValue="manual" className="rounded-md px-2 py-1.5 font-inter text-sm" style={inputStyle}>
            <option value="manual">Manual</option>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
          </select>
        </label>
      </div>

      {state.error && <p className="mt-3 font-inter text-xs" style={{ color: '#ef4444' }}>{state.error}</p>}
      {state.ok && <p className="mt-3 font-inter text-xs" style={{ color: '#86efac' }}>Reseña creada.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md px-4 py-2 font-plus-jakarta text-sm font-bold"
        style={{ background: 'var(--orange)', color: '#fff', opacity: pending ? 0.6 : 1 }}
      >
        {pending ? 'Guardando…' : 'Agregar reseña'}
      </button>
    </form>
  )
}
