import { createClient } from '@/lib/supabase/client'

/**
 * Sube archivos directo del navegador a Supabase Storage, usando la sesión
 * autenticada del admin (las políticas RLS del bucket permiten insert a
 * `authenticated`).
 *
 * ¿Por qué del cliente y no por un Server Action? Porque los Server Actions
 * pasan por una función de Vercel, que corta el body en ~4.5 MB, y Next lo
 * limita a 1 MB por defecto. Subiendo directo a Supabase evitamos ambos topes.
 */

/** Bucket de imágenes de destinos y su tope por archivo (definido en Supabase). */
export const BUCKET_DESTINOS = 'destinos'
export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024 // 5 MB (coincide con file_size_limit del bucket)

/** Valida tamaño/tipo de una imagen antes de subir. Devuelve un error legible o null. */
export function validarImagen(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen (JPG, PNG o WebP).'
  if (file.size > MAX_IMAGEN_BYTES) return 'La imagen supera 5 MB. Comprímela o elige una más liviana.'
  return null
}

/**
 * Sube un archivo al bucket indicado y devuelve su URL pública.
 * `slug` y `campo` solo arman una ruta legible dentro del bucket.
 */
export async function subirAStorage(
  bucket: string,
  slug: string,
  campo: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const rand = Math.random().toString(36).slice(2, 8)
  const path = `${slug || 'sin-slug'}/${campo}-${Date.now()}-${rand}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type || undefined })
  if (error) throw new Error(error.message)

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/** Lee el slug actual del formulario (para agrupar las subidas por destino). */
export function slugDelFormulario(fallback = 'galeria'): string {
  const el = document.querySelector('input[name="slug"]') as HTMLInputElement | null
  return el?.value?.trim() || fallback
}
