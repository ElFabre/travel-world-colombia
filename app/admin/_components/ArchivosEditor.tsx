'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, FileText } from 'lucide-react'
import type { ArchivoAdjunto } from '@/types/destino'
import { BUCKET_DOCUMENTOS, subirAStorage, validarDocumento, tipoDeDocumento, slugDelFormulario } from '@/lib/supabase/upload-cliente'

/** "2.3 MB" / "850 KB" a partir de los bytes guardados con el archivo. */
function pesoLegible(bytes?: number): string {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * Documentos adjuntos del viaje (PDF/Word). Igual que la galería, cada archivo
 * se sube al elegirlo (directo del navegador a Storage, ver upload-cliente.ts)
 * y aquí solo se edita el título visible y se quitan los que sobren.
 */
export function ArchivosEditor({ name, inicial }: { name: string; inicial?: ArchivoAdjunto[] }) {
  const [archivos, setArchivos] = useState<ArchivoAdjunto[]>(inicial ?? [])
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problema = validarDocumento(file)
    if (problema) return setError(problema)
    setError('')
    const slug = slugDelFormulario('documentos')
    start(async () => {
      try {
        const url = await subirAStorage(BUCKET_DOCUMENTOS, slug, 'doc', file)
        const titulo = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Documento'
        setArchivos(a => [...a, { titulo, url, tipo: tipoDeDocumento(file)!, bytes: file.size }])
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  const renombrar = (i: number, titulo: string) =>
    setArchivos(a => a.map((f, idx) => (idx === i ? { ...f, titulo } : f)))
  const quitar = (i: number) => setArchivos(a => a.filter((_, idx) => idx !== i))

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name={name} value={JSON.stringify(archivos)} readOnly />

      <div className="flex flex-col gap-2">
        {archivos.map((f, i) => (
          <div
            key={f.url}
            className="flex items-center gap-3 rounded-md px-3 py-2"
            style={{ border: '1px solid var(--border)' }}
          >
            <FileText size={18} className="shrink-0" style={{ color: 'var(--orange)' }} />
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-inter text-[10px] font-bold uppercase"
              style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
            >
              {f.tipo === 'pdf' ? 'PDF' : 'Word'}
            </span>
            <input
              type="text"
              value={f.titulo}
              onChange={e => renombrar(i, e.target.value)}
              placeholder="Título visible, ej. Itinerario detallado"
              className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 font-inter text-sm outline-none"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <span className="hidden shrink-0 font-inter text-xs sm:inline" style={{ color: 'var(--text-muted)' }}>
              {pesoLegible(f.bytes)}
            </span>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 font-inter text-xs underline"
              style={{ color: 'var(--text-dim)' }}
            >
              Abrir
            </a>
            <button
              type="button"
              onClick={() => quitar(i)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(8, 18, 38,0.85)', color: '#fca5a5' }}
              aria-label="Quitar documento"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <label
          className="flex w-fit cursor-pointer items-center gap-2 rounded-md px-4 py-2.5 font-inter text-xs"
          style={{ border: '1px dashed var(--border-orange)', color: 'var(--orange)' }}
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {pending ? 'Subiendo…' : 'Agregar documento (PDF o Word)'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onFile}
            disabled={pending}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="mt-2 font-inter text-xs" style={{ color: '#fca5a5' }}>{error}</p>}
      <p className="mt-2 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
        Máx 20 MB por archivo. Los PDF se pueden ver en el navegador; los Word solo se descargan —
        si quieres que se vea en línea, guárdalo como PDF antes de subirlo. Todo lo subido queda
        público: no adjuntes documentos con datos personales de clientes.
      </p>
    </div>
  )
}
