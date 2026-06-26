'use client'

import { useActionState, useEffect, useRef } from 'react'
import { crearFaq, type FaqState } from './actions'

const initial: FaqState = {}
const input = 'w-full rounded-md px-3 py-2 font-inter text-sm outline-none'
const inputStyle = { background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const

export function FaqForm() {
  const [state, action, pending] = useActionState(crearFaq, initial)
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
        Nueva pregunta
      </h2>

      <input name="pregunta" required placeholder="¿Pregunta…?" className={input} style={inputStyle} />

      <textarea name="respuesta" required rows={3} placeholder="Respuesta…" className={`${input} mt-3`} style={inputStyle} />

      {state.error && <p className="mt-3 font-inter text-xs" style={{ color: '#ef4444' }}>{state.error}</p>}
      {state.ok && <p className="mt-3 font-inter text-xs" style={{ color: '#86efac' }}>Pregunta creada.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md px-4 py-2 font-plus-jakarta text-sm font-bold"
        style={{ background: 'var(--orange)', color: '#fff', opacity: pending ? 0.6 : 1 }}
      >
        {pending ? 'Guardando…' : 'Agregar pregunta'}
      </button>
    </form>
  )
}
