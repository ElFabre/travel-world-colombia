'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Icono } from '@/components/ui/Icono'
import { NOMBRES_ICONOS } from '@/lib/iconos'

interface Props {
  value: string
  onChange: (nombre: string) => void
}

export function IconPicker({ value, onChange }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierto) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  // Solo iconos del catálogo (`lib/iconos.ts`), que es el mismo que sabe
  // dibujar la web: así nunca se guarda un icono que luego salga como texto.
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/[\s_-]+/g, '')
    if (!t) return NOMBRES_ICONOS
    return NOMBRES_ICONOS.filter(n => n.replace(/-/g, '').includes(t))
  }, [q])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        className="flex h-[34px] w-16 items-center justify-center gap-1 rounded px-2 outline-none"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        title={value ? `Icono: ${value}` : 'Elegir icono'}
        aria-label={value ? `Icono: ${value}` : 'Elegir icono'}
      >
        {value
          ? <Icono nombre={value} size={18} />
          : <span className="font-inter text-[10px]" style={{ color: 'var(--text-muted)' }}>Icono</span>}
      </button>

      {abierto && (
        <div
          className="absolute left-0 top-[40px] z-50 w-72 rounded-lg p-3"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(15,31,61,0.18)' }}
        >
          <div
            className="mb-2 flex items-center gap-2 rounded-md px-2"
            style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar icono…"
              className="w-full bg-transparent py-1.5 font-inter text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setAbierto(false) }}
                title="Quitar icono"
                aria-label="Quitar icono"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="grid max-h-56 grid-cols-7 gap-1 overflow-y-auto">
            {lista.map(n => {
              const activo = n === value
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { onChange(n); setAbierto(false) }}
                  title={n}
                  className="flex h-8 w-8 items-center justify-center rounded"
                  style={{
                    background: activo ? 'var(--orange)' : 'transparent',
                    color: activo ? 'var(--orange-contrast)' : 'var(--text-dim)',
                    border: activo ? 'none' : '1px solid transparent',
                  }}
                >
                  <Icono nombre={n} size={17} />
                </button>
              )
            })}
            {lista.length === 0 && (
              <p className="col-span-7 py-4 text-center font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
