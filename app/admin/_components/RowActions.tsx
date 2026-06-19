'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Eye, EyeOff, Star, Pencil, Trash2 } from 'lucide-react'
import { toggleCampo, eliminarDestino } from '../actions'

interface Props {
  id: string
  nombre: string
  activo: boolean
  destacado: boolean
}

export function RowActions({ id, nombre, activo, destacado }: Props) {
  const [pending, start] = useTransition()

  const btn = 'flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50'

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        title={activo ? 'Activo (clic para ocultar)' : 'Oculto (clic para activar)'}
        disabled={pending}
        onClick={() => start(() => toggleCampo(id, 'activo', !activo))}
        className={btn}
        style={{ color: activo ? '#4ade80' : 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        {activo ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>

      <button
        type="button"
        title={destacado ? 'Destacado' : 'No destacado'}
        disabled={pending}
        onClick={() => start(() => toggleCampo(id, 'destacado', !destacado))}
        className={btn}
        style={{ color: destacado ? 'var(--orange)' : 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        <Star size={15} fill={destacado ? 'var(--orange)' : 'none'} />
      </button>

      <Link href={`/admin/destinos/${id}`} title="Editar" className={btn} style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
        <Pencil size={15} />
      </Link>

      <button
        type="button"
        title="Eliminar"
        disabled={pending}
        onClick={() => {
          if (confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
            start(() => eliminarDestino(id))
          }
        }}
        className={btn}
        style={{ color: '#ef4444', border: '1px solid var(--border)' }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
