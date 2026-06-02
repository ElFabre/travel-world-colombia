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
