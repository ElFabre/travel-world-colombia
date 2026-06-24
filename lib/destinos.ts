import { createClient } from '@/lib/supabase/server'
import type { Destino } from '@/types/destino'

/** Lista de destinos activos, ordenados por `orden`. */
export async function getDestinos(): Promise<Destino[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('destinos')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })

  if (error) {
    console.error('getDestinos error:', error.message)
    return []
  }
  return (data ?? []) as Destino[]
}

export interface ResenaDestino {
  nombre: string
  texto: string
  estrellas: number | null
}

/**
 * Una reseña activa asociada a un destino (por nombre), para el testimonio de
 * la página de detalle. Reusa la tabla `resenas` que se gestiona en el panel.
 */
export async function getResenaDestino(destino: string): Promise<ResenaDestino | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resenas')
    .select('nombre, texto, estrellas')
    .eq('activa', true)
    .ilike('destino', destino)
    .order('orden', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data as ResenaDestino) ?? null
}

/** Un destino activo por slug. Devuelve null si no existe. */
export async function getDestino(slug: string): Promise<Destino | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('destinos')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle()

  if (error) {
    console.error('getDestino error:', error.message)
    return null
  }
  return (data as Destino) ?? null
}
