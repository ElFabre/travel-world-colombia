'use client'

import { useState, useTransition } from 'react'
import { Plus, X, ImagePlus, Loader2 } from 'lucide-react'
import { BUCKET_DESTINOS, subirAStorage, validarImagen, slugDelFormulario } from '@/lib/supabase/upload-cliente'

interface Dia { titulo: string; badge?: string; descripcion?: string; fecha?: string; imagen?: string }

const vacio = (): Dia => ({ titulo: '', badge: '', descripcion: '', fecha: '', imagen: '' })

const inputStyle = { background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const

/** Editor del itinerario día a día: foto + fecha opcional + título + etiqueta + descripción por día. */
export function ItinerarioEditor({ name, inicial }: { name: string; inicial?: Dia[] }) {
  const [filas, setFilas] = useState<Dia[]>(inicial?.length ? inicial : [])
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const set = (i: number, key: keyof Dia, val: string) =>
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
    const slug = slugDelFormulario('itinerario')
    start(async () => {
      try {
        const url = await subirAStorage(BUCKET_DESTINOS, slug, `dia-${Math.random().toString(36).slice(2, 8)}`, file)
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
            {/* Número de día + foto */}
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span className="rounded px-2 py-1 font-cinzel text-[10px] font-bold uppercase tracking-widest" style={{ background: 'var(--card-bg)', color: 'var(--orange)', border: '1px solid var(--border-orange)' }}>
                Día {String(i + 1).padStart(2, '0')}
              </span>
              <label
                className="relative flex h-20 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-md font-inter text-[11px]"
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
            </div>

            {/* Campos */}
            <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <input value={f.titulo} onChange={e => set(i, 'titulo', e.target.value)} placeholder="Título del día (ej. Arribo y bienvenida)" className="min-w-0 flex-1 rounded px-2 py-2 font-inter text-base outline-none" style={inputStyle} />
                <input value={f.fecha ?? ''} onChange={e => set(i, 'fecha', e.target.value)} placeholder="Fecha (ej. 11 NOV)" className="w-32 rounded px-2 py-2 font-inter text-sm outline-none" style={inputStyle} />
              </div>
              <input value={f.badge ?? ''} onChange={e => set(i, 'badge', e.target.value)} placeholder="Etiqueta (ej. Cena incluida)" className="w-full rounded px-2 py-2 font-inter text-sm outline-none" style={inputStyle} />
              <textarea value={f.descripcion ?? ''} onChange={e => set(i, 'descripcion', e.target.value)} placeholder="Descripción del día" rows={3} className="w-full rounded px-2 py-2 font-inter text-base outline-none" style={inputStyle} />
            </div>

            <button type="button" onClick={() => quitar(i)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded" style={{ color: '#ef4444', border: '1px solid var(--border)' }} aria-label="Quitar">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 font-inter text-xs" style={{ color: '#ef4444' }}>{error}</p>}

      <button type="button" onClick={agregar} className="mt-2 flex items-center gap-1.5 rounded-md px-3 py-2 font-inter text-sm" style={{ color: 'var(--orange)', border: '1px solid var(--border-orange)' }}>
        <Plus size={13} /> Agregar día
      </button>
      <p className="mt-2 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
        Define el slug arriba antes de subir fotos. La fecha es opcional (solo salidas con fecha
        fija) y se muestra junto al número del día, ej. &quot;DÍA 03 · 11 NOV&quot;.
      </p>
    </div>
  )
}
