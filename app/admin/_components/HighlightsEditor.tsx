'use client'

import { useState, useTransition } from 'react'
import { Plus, X, ImagePlus, Loader2 } from 'lucide-react'
import { BUCKET_DESTINOS, subirAStorage, validarImagen, slugDelFormulario } from '@/lib/supabase/upload-cliente'

interface Highlight { icono: string; titulo: string; descripcion: string; imagen?: string; precio?: string }

const vacio = (): Highlight => ({ icono: '', titulo: '', descripcion: '', imagen: '', precio: '' })

const inputStyle = { background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const

/** Editor de "Experiencias únicas": icono + título + descripción + imagen por card. */
export function HighlightsEditor({ name, inicial }: { name: string; inicial?: Highlight[] }) {
  const [filas, setFilas] = useState<Highlight[]>(inicial?.length ? inicial : [])
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const set = (i: number, key: keyof Highlight, val: string) =>
    setFilas(s => s.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)))
  const agregar = () => setFilas(s => [...s, vacio()])
  const quitar = (i: number) => setFilas(s => s.filter((_, idx) => idx !== i))

  const subir = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problema = validarImagen(file)
    if (problema) return setError(problema)
    setError('')
    const slug = slugDelFormulario('highlight')
    start(async () => {
      try {
        const url = await subirAStorage(BUCKET_DESTINOS, slug, `highlight-${Math.random().toString(36).slice(2, 8)}`, file)
        set(i, 'imagen', url)
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  // Solo filas con título.
  const limpio = filas.filter(f => (f.titulo ?? '').trim() !== '')

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name={name} value={JSON.stringify(limpio)} readOnly />

      <div className="flex flex-col gap-3">
        {filas.map((f, i) => (
          <div key={i} className="flex flex-wrap items-start gap-3 rounded-lg p-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
            {/* Imagen */}
            <label
              className="relative flex h-20 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md font-inter text-[11px]"
              style={{ border: '1px dashed var(--border-orange)', color: 'var(--orange)' }}
            >
              {f.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.imagen} alt="" className="h-full w-full object-cover" />
              ) : pending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span className="flex flex-col items-center gap-1"><ImagePlus size={16} /> Foto</span>
              )}
              <input type="file" accept="image/*" onChange={e => subir(i, e)} disabled={pending} className="hidden" />
            </label>

            {/* Campos */}
            <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <input value={f.icono} onChange={e => set(i, 'icono', e.target.value)} placeholder="🏖️" className="w-16 rounded px-2 py-2 text-center font-inter text-base outline-none" style={inputStyle} />
                <input value={f.titulo} onChange={e => set(i, 'titulo', e.target.value)} placeholder="Título" className="min-w-0 flex-1 rounded px-2 py-2 font-inter text-base outline-none" style={inputStyle} />
              </div>
              <textarea value={f.descripcion} onChange={e => set(i, 'descripcion', e.target.value)} placeholder="Descripción" rows={2} className="w-full rounded px-2 py-2 font-inter text-base outline-none" style={inputStyle} />
              <input value={f.precio ?? ''} onChange={e => set(i, 'precio', e.target.value)} placeholder="Valor si es opcional (ej. $180.000) — dejar vacío si está incluida" className="w-full rounded px-2 py-2 font-inter text-sm outline-none" style={inputStyle} />
            </div>

            <button type="button" onClick={() => quitar(i)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded" style={{ color: '#ef4444', border: '1px solid var(--border)' }} aria-label="Quitar">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 font-inter text-xs" style={{ color: '#ef4444' }}>{error}</p>}

      <button type="button" onClick={agregar} className="mt-2 flex items-center gap-1.5 rounded-md px-3 py-2 font-inter text-sm" style={{ color: 'var(--orange)', border: '1px solid var(--border-orange)' }}>
        <Plus size={13} /> Agregar experiencia
      </button>
      <p className="mt-2 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
        Define el slug arriba antes de subir fotos. Se muestran todas en la web; si la actividad
        es opcional, escribe su valor y aparecerá como etiqueta sobre la tarjeta.
      </p>
    </div>
  )
}
