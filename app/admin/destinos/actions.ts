'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarActividad } from '@/lib/admin/audit'
import { destinoSchema } from '@/lib/validations/destino'

export type FormState = { error?: string }

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

/**
 * Construye el payload validado a partir del FormData.
 * Las imágenes se suben directo del navegador a Supabase Storage (ver
 * lib/supabase/upload-cliente.ts); aquí solo llegan sus URLs en campos ocultos.
 */
function construirPayload(formData: FormData) {
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

  const imagen_hero = texto(formData.get('imagen_hero'))
  const imagen_thumb = texto(formData.get('imagen_thumb'))
  const imagen_about = texto(formData.get('imagen_about'))

  return { ...parsed.data, imagen_hero, imagen_thumb, imagen_about }
}

function revalidar(slug?: string) {
  revalidatePath('/')
  revalidatePath('/destinos')
  if (slug) revalidatePath(`/destinos/${slug}`)
  revalidatePath('/admin')
  revalidatePath('/admin/viajes')
  revalidatePath('/sitemap.xml')
}

/** Crea un nuevo destino. */
export async function crearDestino(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireEditor()
  const admin = createAdminClient()

  let payload
  try {
    payload = construirPayload(formData)
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { error } = await admin.from('destinos').insert(payload)
  if (error) {
    return { error: error.code === '23505' ? 'Ya existe un viaje con ese slug.' : error.message }
  }

  await registrarActividad({
    email: user.email!,
    accion: 'crear',
    slug: payload.slug,
    nombre: payload.nombre,
  })

  revalidar(payload.slug)
  redirect('/admin/viajes')
}

/** Actualiza un destino existente (id se enlaza con .bind). */
export async function actualizarDestino(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireEditor()
  const admin = createAdminClient()

  let payload
  try {
    payload = construirPayload(formData)
  } catch (e) {
    return { error: (e as Error).message }
  }

  const { error } = await admin.from('destinos').update(payload).eq('id', id)
  if (error) {
    return { error: error.code === '23505' ? 'Ya existe un viaje con ese slug.' : error.message }
  }

  await registrarActividad({
    email: user.email!,
    accion: 'actualizar',
    slug: payload.slug,
    nombre: payload.nombre,
  })

  revalidar(payload.slug)
  redirect('/admin/viajes')
}
