'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Destino } from '@/types/destino'
import type { FormState } from '../destinos/actions'

type Action = (prev: FormState, fd: FormData) => Promise<FormState>

const inputCls = 'w-full rounded-md px-3 py-2 font-inter text-sm outline-none'
const inputStyle = { background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const
const labelCls = 'mb-1 block font-inter text-xs'
const labelStyle = { color: 'var(--text-dim)' } as const

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <legend className="px-2 font-cinzel text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--orange)' }}>
        {titulo}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Campo({
  label, name, defaultValue, type = 'text', required, placeholder, hint, full,
}: {
  label: string; name: string; defaultValue?: string | number; type?: string
  required?: boolean; placeholder?: string; hint?: string; full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <label className={labelCls} style={labelStyle}>{label}{required && ' *'}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={inputCls}
        style={inputStyle}
      />
      {hint && <p className="mt-1 font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function Area({
  label, name, defaultValue, rows = 4, placeholder, hint,
}: {
  label: string; name: string; defaultValue?: string; rows?: number; placeholder?: string; hint?: string
}) {
  return (
    <div className="sm:col-span-2">
      <label className={labelCls} style={labelStyle}>{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        placeholder={placeholder}
        className={inputCls}
        style={inputStyle}
      />
      {hint && <p className="mt-1 font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function ImagenCampo({ label, name, urlActual }: { label: string; name: string; urlActual?: string }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      {urlActual && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlActual} alt="" className="mb-2 h-20 w-full rounded-md object-cover" style={{ border: '1px solid var(--border)' }} />
      )}
      <input type="hidden" name={name} defaultValue={urlActual ?? ''} />
      <input
        type="file"
        name={`${name}_file`}
        accept="image/*"
        className="w-full font-inter text-xs"
        style={{ color: 'var(--text-dim)' }}
      />
      <p className="mt-1 font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {urlActual ? 'Sube una nueva para reemplazar, o deja vacío para conservar.' : 'Opcional.'}
      </p>
    </div>
  )
}

export function DestinoForm({ action, destino, titulo }: { action: Action; destino?: Destino; titulo: string }) {
  const [state, formAction, pending] = useActionState(action, {})
  const d = destino

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex h-9 w-9 items-center justify-center rounded-md" style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-plus-jakarta text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{titulo}</h1>
        </div>
      </div>

      <Seccion titulo="Básico">
        <Campo label="Nombre" name="nombre" defaultValue={d?.nombre} required placeholder="Punta Cana" />
        <Campo label="Slug (URL)" name="slug" defaultValue={d?.slug} required placeholder="punta-cana" hint="Solo minúsculas, números y guiones." />
        <Campo label="País" name="pais" defaultValue={d?.pais} required placeholder="República Dominicana" />
        <Campo label="Región" name="region" defaultValue={d?.region} placeholder="Caribe" />
        <Campo label="Precio desde" name="precio_desde" defaultValue={d?.precio_desde} placeholder="Desde $899 USD" />
        <Campo label="Duración" name="duracion" defaultValue={d?.duracion} placeholder="8 días / 7 noches" />
        <Campo label="Cupos disponibles" name="cupos_disponibles" type="number" defaultValue={d?.cupos_disponibles} placeholder="10" />
        <Campo label="Orden" name="orden" type="number" defaultValue={d?.orden ?? 0} hint="Menor = aparece primero." />
        <label className="flex items-center gap-2 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          <input type="checkbox" name="activo" defaultChecked={d ? d.activo : true} /> Activo (visible en la web)
        </label>
        <label className="flex items-center gap-2 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          <input type="checkbox" name="destacado" defaultChecked={d?.destacado ?? false} /> Destacado (home)
        </label>
      </Seccion>

      <Seccion titulo="Hero">
        <Campo label="Frase del hero" name="frase_hero" defaultValue={d?.frase_hero} full placeholder="El Caribe que siempre soñaste, todo incluido." />
        <Campo label="Autor de la frase" name="autor_frase" defaultValue={d?.autor_frase} />
        <Campo label="Cargo del autor" name="cargo_autor" defaultValue={d?.cargo_autor} />
      </Seccion>

      <Seccion titulo="Imágenes">
        <ImagenCampo label="Imagen hero (fondo grande)" name="imagen_hero" urlActual={d?.imagen_hero} />
        <ImagenCampo label="Imagen thumbnail (tarjeta)" name="imagen_thumb" urlActual={d?.imagen_thumb} />
        <ImagenCampo label="Imagen 'sobre el destino'" name="imagen_about" urlActual={d?.imagen_about} />
      </Seccion>

      <Seccion titulo="Contenido">
        <Campo label="Subtítulo" name="subtitulo" defaultValue={d?.subtitulo} full />
        <Area label="Descripción" name="descripcion" defaultValue={d?.descripcion} rows={5} />
      </Seccion>

      <Seccion titulo="Qué incluye">
        <Area label="Incluye (uno por línea)" name="incluye" defaultValue={d?.incluye?.join('\n')} hint="Una característica por línea." />
        <Area label="No incluye (uno por línea)" name="no_incluye" defaultValue={d?.no_incluye?.join('\n')} hint="Una por línea." />
      </Seccion>

      <Seccion titulo="SEO & CTA">
        <Campo label="Título del CTA final" name="cta_titulo" defaultValue={d?.cta_titulo} full />
        <Area label="Subtítulo del CTA" name="cta_subtitulo" defaultValue={d?.cta_subtitulo} rows={2} />
        <Campo label="Meta título (SEO)" name="meta_title" defaultValue={d?.meta_title} full />
        <Area label="Meta descripción (SEO)" name="meta_description" defaultValue={d?.meta_description} rows={2} />
        <Area label="Keywords (una por línea)" name="keywords" defaultValue={d?.keywords?.join('\n')} rows={3} />
      </Seccion>

      {state.error && (
        <p className="rounded-md p-3 font-inter text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md px-6 py-2.5 font-plus-jakarta text-sm font-bold"
          style={{ background: 'var(--orange)', color: '#fff', opacity: pending ? 0.6 : 1 }}
        >
          {pending ? 'Guardando…' : 'Guardar viaje'}
        </button>
        <Link href="/admin" className="font-inter text-sm" style={{ color: 'var(--text-dim)' }}>Cancelar</Link>
      </div>
    </form>
  )
}
