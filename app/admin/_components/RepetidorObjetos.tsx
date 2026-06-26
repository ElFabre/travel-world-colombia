'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { IconPicker } from './IconPicker'

interface CampoDef {
  key: string
  label: string
  ancho?: 'corto' | 'largo'
  tipo?: 'texto' | 'icono'
}

type Fila = Record<string, string>

export function RepetidorObjetos({
  name,
  campos,
  inicial,
  etiqueta,
}: {
  name: string
  campos: CampoDef[]
  inicial?: Fila[]
  etiqueta: string
}) {
  const filaVacia = (): Fila => Object.fromEntries(campos.map(c => [c.key, '']))
  const [filas, setFilas] = useState<Fila[]>(inicial && inicial.length ? inicial : [])

  const set = (i: number, key: string, val: string) =>
    setFilas(s => s.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)))
  const agregar = () => setFilas(s => [...s, filaVacia()])
  const quitar = (i: number) => setFilas(s => s.filter((_, idx) => idx !== i))

  // Solo filas con al menos un campo no vacío.
  const limpio = filas.filter(f => campos.some(c => (f[c.key] ?? '').trim() !== ''))

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name={name} value={JSON.stringify(limpio)} readOnly />

      <div className="flex flex-col gap-2">
        {filas.map((f, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-md p-2"
            style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}
          >
            {campos.map(c =>
              c.tipo === 'icono' ? (
                <IconPicker
                  key={c.key}
                  value={f[c.key] ?? ''}
                  onChange={val => set(i, c.key, val)}
                />
              ) : (
                <input
                  key={c.key}
                  value={f[c.key] ?? ''}
                  onChange={e => set(i, c.key, e.target.value)}
                  placeholder={c.label}
                  className={`${c.ancho === 'corto' ? 'w-20' : 'min-w-[8rem] flex-1'} rounded px-2 py-2 font-inter text-base outline-none`}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              )
            )}
            <button
              type="button"
              onClick={() => quitar(i)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
              style={{ color: '#ef4444', border: '1px solid var(--border)' }}
              aria-label="Quitar"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregar}
        className="mt-2 flex items-center gap-1.5 rounded-md px-3 py-2 font-inter text-sm"
        style={{ color: 'var(--orange)', border: '1px solid var(--border-orange)' }}
      >
        <Plus size={13} />
        Agregar {etiqueta}
      </button>
    </div>
  )
}
