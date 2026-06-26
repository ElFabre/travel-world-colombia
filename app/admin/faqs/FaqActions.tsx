'use client'

import { useTransition } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { toggleFaqActiva, eliminarFaq } from './actions'
import type { Role } from '@/lib/admin/allowlist'

const btn = 'flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50'

export function FaqActions({ id, pregunta, activa, rol }: { id: string; pregunta: string; activa: boolean; rol: Role }) {
  const [pending, start] = useTransition()
  if (rol === 'lector') {
    return <span className="font-inter text-xs" style={{ color: 'var(--text-muted)' }}>Solo lectura</span>
  }
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title={activa ? 'Activa (clic para ocultar)' : 'Oculta (clic para activar)'}
        disabled={pending}
        onClick={() => start(() => toggleFaqActiva(id, !activa, pregunta))}
        className={btn}
        style={{ color: activa ? '#16a34a' : 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        {activa ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      {rol === 'admin' && (
        <button
          type="button"
          title="Eliminar"
          disabled={pending}
          onClick={() => {
            if (confirm(`¿Eliminar la pregunta "${pregunta}"?`)) start(() => eliminarFaq(id, pregunta))
          }}
          className={btn}
          style={{ color: '#ef4444', border: '1px solid var(--border)' }}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}
