'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { subirArchivo } from '../destinos/actions'

export function GaleriaEditor({ name, inicial }: { name: string; inicial?: string[] }) {
  const [urls, setUrls] = useState<string[]>(inicial ?? [])
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    const slug =
      (document.querySelector('input[name="slug"]') as HTMLInputElement | null)?.value?.trim() || 'galeria'
    const fd = new FormData()
    fd.append('file', file)
    fd.append('slug', slug)
    start(async () => {
      const res = await subirArchivo(fd)
      if (res.error) setError(res.error)
      else if (res.url) setUrls(u => [...u, res.url!])
    })
  }

  const quitar = (i: number) => setUrls(u => u.filter((_, idx) => idx !== i))

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name={name} value={JSON.stringify(urls)} readOnly />

      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={i} className="relative h-20 w-28 overflow-hidden rounded-md" style={{ border: '1px solid var(--border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => quitar(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: 'rgba(6,14,26,0.85)', color: '#fca5a5' }}
              aria-label="Quitar imagen"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <label
          className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md font-inter text-[11px]"
          style={{ border: '1px dashed var(--border-orange)', color: 'var(--orange)' }}
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {pending ? 'Subiendo…' : 'Agregar'}
          <input type="file" accept="image/*" onChange={onFile} disabled={pending} className="hidden" />
        </label>
      </div>

      {error && <p className="mt-2 font-inter text-[11px]" style={{ color: '#fca5a5' }}>{error}</p>}
      <p className="mt-2 font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Las imágenes se suben al elegirlas. Define primero el slug arriba.
      </p>
    </div>
  )
}
