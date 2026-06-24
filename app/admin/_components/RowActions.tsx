'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Eye, EyeOff, Star, Pencil, Trash2 } from 'lucide-react'
import { toggleCampo, eliminarDestino } from '../actions'
import type { Role } from '@/lib/admin/allowlist'

interface Props {
  id: string
  nombre: string
  activo: boolean
  destacado: boolean
  rol: Role
}

export function RowActions({ id, nombre, activo, destacado, rol }: Props) {
  const [pending, start] = useTransition()
  const puedeModificar = rol !== 'lector'
  const esAdmin = rol === 'admin'

  const btn = 'flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50'

  if (!puedeModificar) {
    return <span className="font-inter text-xs" style={{ color: 'var(--text-muted)' }}>Solo lectura</span>
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        title={activo ? 'Activo (clic para ocultar)' : 'Oculto (clic para activar)'}
        disabled={pending}
        onClick={() => start(() => toggleCampo(id, 'activo', !activo))}
        className={btn}
        style={{ color: activo ? '#16a34a' : 'var(--text-muted)', border: '1px solid var(--border)' }}
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

      {esAdmin && (
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
      )}
    </div>
  )
}
