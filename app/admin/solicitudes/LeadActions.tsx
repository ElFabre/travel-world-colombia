'use client'

import { useTransition } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { toggleAtendido } from './actions'

/** Botón para marcar/reabrir una solicitud. */
export function AtendidoBtn({ id, atendido }: { id: string; atendido: boolean }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => toggleAtendido(id, !atendido))}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-inter text-xs disabled:opacity-50"
      style={
        atendido
          ? { color: 'var(--text-dim)', border: '1px solid var(--border)' }
          : { background: 'var(--orange)', color: '#fff' }
      }
    >
      {atendido ? <RotateCcw size={14} /> : <Check size={14} />}
      {pending ? '…' : atendido ? 'Reabrir' : 'Marcar atendido'}
    </button>
  )
}
