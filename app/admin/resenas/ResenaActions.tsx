'use client'

import { useTransition } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { toggleResenaActiva, eliminarResena } from './actions'

const btn = 'flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50'

export function ResenaActions({ id, nombre, activa }: { id: string; nombre: string; activa: boolean }) {
  const [pending, start] = useTransition()
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title={activa ? 'Activa (clic para ocultar)' : 'Oculta (clic para activar)'}
        disabled={pending}
        onClick={() => start(() => toggleResenaActiva(id, !activa, nombre))}
        className={btn}
        style={{ color: activa ? '#4ade80' : 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        {activa ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button
        type="button"
        title="Eliminar"
        disabled={pending}
        onClick={() => {
          if (confirm(`¿Eliminar la reseña de "${nombre}"?`)) start(() => eliminarResena(id, nombre))
        }}
        className={btn}
        style={{ color: '#ef4444', border: '1px solid var(--border)' }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
