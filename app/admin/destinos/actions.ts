'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { destinoSchema } from '@/lib/validations/destino'

export type FormState = { error?: string }

const BUCKET = 'destinos'

/** Texto multilínea → array de líneas no vacías. */
function lineas(v: FormDataEntryValue | null): string[] {
  return String(v ?? '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
}

/** Entero o undefined si está vacío / no es número. */
function numEntero(v: FormDataEntryValue | null): number | undefined {
  const s = String(v ?? '').trim()
  if (s === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? Math.trunc(n) : undefined
}

function texto(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? '').trim()
  return s === '' ? undefined : s
}

/** Parsea un array JSON serializado (repetidores del formulario). */
function jsonArray(v: FormDataEntryValue | null): unknown[] {
  try {
    const p = JSON.parse(String(v ?? '[]'))
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

/** Sube un archivo al bucket si viene uno nuevo; si no, conserva la URL actual. */
async function subirImagen(
  admin: SupabaseClient,
  slug: string,
  campo: string,
  file: File | null,
  urlActual?: string
): Promise<string | undefined> {
  if (!file || file.size === 0) return urlActual
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase()
  const path = `${slug}/${campo}-${Date.now()}.${ext}`
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'image/webp' })
  if (error) throw new Error(`No se pudo subir la imagen (${campo}): ${error.message}`)
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Construye el payload validado + URLs de imágenes a partir del FormData. */
async function construirPayload(formData: FormData, admin: SupabaseClient) {
  const slug = String(formData.get('slug') ?? '').trim()

  const base = {
    nombre: String(formData.get('nombre') ?? '').trim(),
    slug,
    pais: String(formData.get('pais') ?? '').trim(),
    region: texto(formData.get('region')),
    activo: formData.get('activo') === 'on',
    destacado: formData.get('destacado') === 'on',
    orden: numEntero(formData.get('orden')) ?? 0,
    precio_desde: texto(formData.get('precio_desde')),
    duracion: texto(formData.get('duracion')),
    cupos_disponibles: numEntero(formData.get('cupos_disponibles')),
    frase_hero: texto(formData.get('frase_hero')),
    autor_frase: texto(formData.get('autor_frase')),
    cargo_autor: texto(formData.get('cargo_autor')),
    subtitulo: texto(formData.get('subtitulo')),
    descripcion: texto(formData.get('descripcion')),
    incluye: lineas(formData.get('incluye')),
    no_incluye: lineas(formData.get('no_incluye')),
    keywords: lineas(formData.get('keywords')),
    stats: jsonArray(formData.get('stats')),
    highlights: jsonArray(formData.get('highlights')),
    info_clave: jsonArray(formData.get('info_clave')),
    galeria: jsonArray(formData.get('galeria')),
    cta_titulo: texto(formData.get('cta_titulo')),
    cta_subtitulo: texto(formData.get('cta_subtitulo')),
    meta_title: texto(formData.get('meta_title')),
    meta_description: texto(formData.get('meta_description')),
  }

  const parsed = destinoSchema.safeParse(base)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Datos inválidos.')
  }

  const imagen_hero = await subirImagen(admin, slug, 'hero', formData.get('imagen_hero_file') as File, texto(formData.get('imagen_hero')))
  const imagen_thumb = await subirImagen(admin, slug, 'thumb', formData.get('imagen_thumb_file') as File, texto(formData.get('imagen_thumb')))
  const imagen_about = await subirImagen(admin, slug, 'about', formData.get('imagen_about_file') as File, texto(formData.get('imagen_about')))

  return { ...parsed.data, imagen_hero, imagen_thumb, imagen_about }
}

/** Sube un archivo individual (galería) y devuelve su URL pública. */
export async function subirArchivo(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const file = formData.get('file') as File | null
  const slug = String(formData.get('slug') ?? '').trim() || 'galeria'
  if (!file || file.size === 0) return { error: 'No se seleccionó archivo.' }
  try {
    const rand = Math.random().toString(36).slice(2, 8)
    const url = await subirImagen(admin, slug, `galeria-${rand}`, file)
    return { url }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

function revalidar(slug?: string) {
  revalidatePath('/')
  revalidatePath('/destinos')
  if (slug) revalidatePath(`/destinos/${slug}`)
  revalidatePath('/admin')
  revalidatePath('/sitemap.xml')
}

/** Crea un nuevo destino. */
export async function crearDestino(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const admin = createAdminClient()

  let payload
  try {
    payload = await construirPayload(formData, admin)
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { error } = await admin.from('destinos').insert(payload)
  if (error) {
    return { error: error.code === '23505' ? 'Ya existe un viaje con ese slug.' : error.message }
  }

  revalidar(payload.slug)
  redirect('/admin')
}

/** Actualiza un destino existente (id se enlaza con .bind). */
export async function actualizarDestino(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const admin = createAdminClient()

  let payload
  try {
    payload = await construirPayload(formData, admin)
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { error } = await admin.from('destinos').update(payload).eq('id', id)
  if (error) {
    return { error: error.code === '23505' ? 'Ya existe un viaje con ese slug.' : error.message }
  }

  revalidar(payload.slug)
  redirect('/admin')
}
