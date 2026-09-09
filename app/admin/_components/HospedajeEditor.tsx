'use client'

import { useState, useTransition } from 'react'
import { Plus, X, ImagePlus, Loader2 } from 'lucide-react'
import type { OpcionHospedaje, CiudadHospedaje, HabitacionHospedaje } from '@/types/destino'
import { BUCKET_DESTINOS, subirAStorage, validarImagen, slugDelFormulario } from '@/lib/supabase/upload-cliente'

const vacia = (): OpcionHospedaje => ({ titulo: '', estrellas: undefined, descripcion: '', imagen: '', ciudades: [], amenidades: [], habitaciones: [] })

const inputStyle = { background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const

/**
 * Editor de la sección "Hospedaje" del producto: una opción por categoría
 * (2★ hostal, 3★ turista…), cada una con foto, hoteles por ciudad, amenidades
 * y tipos de habitación con tarifa. Sin opciones cargadas, la sección no
 * aparece en la web (así se habilita/deshabilita por paquete).
 */
export function HospedajeEditor({ name, inicial }: { name: string; inicial?: OpcionHospedaje[] }) {
  const [ops, setOps] = useState<OpcionHospedaje[]>(inicial ?? [])
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const set = (i: number, cambios: Partial<OpcionHospedaje>) =>
    setOps(s => s.map((o, idx) => (idx === i ? { ...o, ...cambios } : o)))

  const setCiudad = (i: number, ci: number, cambios: Partial<CiudadHospedaje>) =>
    setOps(s => s.map((o, idx) => idx === i
      ? { ...o, ciudades: (o.ciudades ?? []).map((c, cidx) => (cidx === ci ? { ...c, ...cambios } : c)) }
      : o))

  const setHab = (i: number, hi: number, cambios: Partial<HabitacionHospedaje>) =>
    setOps(s => s.map((o, idx) => idx === i
      ? { ...o, habitaciones: (o.habitaciones ?? []).map((h, hidx) => (hidx === hi ? { ...h, ...cambios } : h)) }
      : o))

  const subir = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problema = validarImagen(file)
    if (problema) return setError(problema)
    setError('')
    const slug = slugDelFormulario('hospedaje')
    start(async () => {
      try {
        const url = await subirAStorage(BUCKET_DESTINOS, slug, `hospedaje-${Math.random().toString(36).slice(2, 8)}`, file)
        set(i, { imagen: url })
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  // Solo opciones con título; dentro, solo ciudades con nombre y habitaciones con tipo.
  const limpio = ops
    .filter(o => (o.titulo ?? '').trim() !== '')
    .map(o => ({
      ...o,
      estrellas: o.estrellas || undefined,
      ciudades: (o.ciudades ?? [])
        .filter(c => c.nombre.trim() !== '')
        .map(c => ({ nombre: c.nombre.trim(), hoteles: c.hoteles.map(h => h.trim()).filter(Boolean) })),
      amenidades: (o.amenidades ?? []).map(a => a.trim()).filter(Boolean),
      habitaciones: (o.habitaciones ?? [])
        .filter(h => h.tipo.trim() !== '')
        .map(h => ({ tipo: h.tipo.trim(), precio: h.precio?.trim() || undefined })),
    }))

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name={name} value={JSON.stringify(limpio)} readOnly />

      <div className="flex flex-col gap-4">
        {ops.map((o, i) => (
          <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
            {/* Cabecera de la opción: foto + título + estrellas + quitar */}
            <div className="flex flex-wrap items-start gap-3">
              <label
                className="relative flex h-20 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md font-inter text-[11px]"
                style={{ border: '1px dashed var(--border-orange)', color: 'var(--orange)' }}
              >
                {o.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imagen} alt="" className="h-full w-full object-cover" />
                ) : pending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span className="flex flex-col items-center gap-1"><ImagePlus size={16} /> Foto</span>
                )}
                <input type="file" accept="image/*" onChange={e => subir(i, e)} disabled={pending} className="hidden" />
              </label>

              <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
                <div className="flex gap-2">
                  <input value={o.titulo} onChange={e => set(i, { titulo: e.target.value })} placeholder="Título de la opción (ej. Hostal o similares)" className="min-w-0 flex-1 rounded px-2 py-2 font-inter text-base outline-none" style={inputStyle} />
                  <select
                    value={o.estrellas ?? ''}
                    onChange={e => set(i, { estrellas: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-32 rounded px-2 py-2 font-inter text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="">Sin estrellas</option>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                  </select>
                </div>
                <input value={o.descripcion ?? ''} onChange={e => set(i, { descripcion: e.target.value })} placeholder="Descripción corta (ej. Ambiente acogedor con las comodidades esenciales)" className="w-full rounded px-2 py-2 font-inter text-sm outline-none" style={inputStyle} />
                <input
                  value={(o.amenidades ?? []).join(', ')}
                  onChange={e => set(i, { amenidades: e.target.value.split(',').map(s => s.replace(/^\s+/, '')) })}
                  placeholder="Amenidades separadas por coma (ej. Wi-Fi, Desayuno buffet, Centro histórico)"
                  className="w-full rounded px-2 py-2 font-inter text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <button type="button" onClick={() => setOps(s => s.filter((_, idx) => idx !== i))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded" style={{ color: '#ef4444', border: '1px solid var(--border)' }} aria-label="Quitar opción de hospedaje">
                <X size={14} />
              </button>
            </div>

            {/* Hoteles por ciudad */}
            <div className="mt-3">
              <p className="mb-1.5 font-inter text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>Hoteles por ciudad</p>
              <div className="flex flex-col gap-2">
                {(o.ciudades ?? []).map((c, ci) => (
                  <div key={ci} className="flex items-start gap-2">
                    <input value={c.nombre} onChange={e => setCiudad(i, ci, { nombre: e.target.value })} placeholder="Ciudad (ej. Cusco)" className="w-36 rounded px-2 py-2 font-inter text-sm outline-none" style={inputStyle} />
                    <textarea
                      value={c.hoteles.join('\n')}
                      onChange={e => setCiudad(i, ci, { hoteles: e.target.value.split('\n') })}
                      placeholder={'Un hotel por línea (Enter)\nej. Fray Bartolome'}
                      rows={2}
                      className="min-w-0 flex-1 rounded px-2 py-2 font-inter text-sm outline-none"
                      style={inputStyle}
                    />
                    <button type="button" onClick={() => set(i, { ciudades: (o.ciudades ?? []).filter((_, idx) => idx !== ci) })} className="flex h-7 w-7 shrink-0 items-center justify-center rounded" style={{ color: '#ef4444', border: '1px solid var(--border)' }} aria-label="Quitar ciudad">
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => set(i, { ciudades: [...(o.ciudades ?? []), { nombre: '', hoteles: [] }] })} className="flex w-fit items-center gap-1.5 rounded px-2.5 py-1.5 font-inter text-xs" style={{ color: 'var(--orange)', border: '1px solid var(--border-orange)' }}>
                  <Plus size={12} /> Agregar ciudad
                </button>
              </div>
            </div>

            {/* Tipos de habitación */}
            <div className="mt-3">
              <p className="mb-1.5 font-inter text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>Tipos de habitación (con tarifa opcional)</p>
              <div className="flex flex-col gap-2">
                {(o.habitaciones ?? []).map((h, hi) => (
                  <div key={hi} className="flex items-center gap-2">
                    <input value={h.tipo} onChange={e => setHab(i, hi, { tipo: e.target.value })} placeholder="Tipo (ej. Doble)" className="w-36 rounded px-2 py-2 font-inter text-sm outline-none" style={inputStyle} />
                    <input value={h.precio ?? ''} onChange={e => setHab(i, hi, { precio: e.target.value })} placeholder="Tarifa (ej. USD $1.440 por persona) — opcional" className="min-w-0 flex-1 rounded px-2 py-2 font-inter text-sm outline-none" style={inputStyle} />
                    <button type="button" onClick={() => set(i, { habitaciones: (o.habitaciones ?? []).filter((_, idx) => idx !== hi) })} className="flex h-7 w-7 shrink-0 items-center justify-center rounded" style={{ color: '#ef4444', border: '1px solid var(--border)' }} aria-label="Quitar habitación">
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => set(i, { habitaciones: [...(o.habitaciones ?? []), { tipo: '', precio: '' }] })} className="flex w-fit items-center gap-1.5 rounded px-2.5 py-1.5 font-inter text-xs" style={{ color: 'var(--orange)', border: '1px solid var(--border-orange)' }}>
                  <Plus size={12} /> Agregar habitación
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 font-inter text-xs" style={{ color: '#ef4444' }}>{error}</p>}

      <button type="button" onClick={() => setOps(s => [...s, vacia()])} className="mt-2 flex items-center gap-1.5 rounded-md px-3 py-2 font-inter text-sm" style={{ color: 'var(--orange)', border: '1px solid var(--border-orange)' }}>
        <Plus size={13} /> Agregar opción de hospedaje
      </button>
      <p className="mt-2 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
        Cada opción es una pestaña de la sección &quot;Hospedaje&quot; del producto (ej. 2★ Hostal,
        3★ Hotel turista). Sin opciones, la sección no aparece. Define el slug arriba antes de
        subir fotos; foto horizontal 4:3 (ideal 1200 × 900 px), JPG o WebP.
      </p>
    </div>
  )
}
