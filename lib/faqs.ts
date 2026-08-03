import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/publico'

export interface Faq {
  id: string
  pregunta: string
  respuesta: string
}

/**
 * Preguntas frecuentes activas, ordenadas. Usa el cliente público (anon),
 * así que RLS solo expone las filas con `activa = true`. Alimenta tanto el
 * acordeón visible como el JSON-LD (FAQPage) de la web.
 */
export const getFaqs = cache(async function getFaqs(): Promise<Faq[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('faqs')
    .select('id, pregunta, respuesta')
    .eq('activa', true)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getFaqs error:', error.message)
    return []
  }
  return (data ?? []) as Faq[]
})
