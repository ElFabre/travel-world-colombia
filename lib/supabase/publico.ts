import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente para las LECTURAS PÚBLICAS del sitio (destinos, reseñas, FAQ).
 *
 * A diferencia de `lib/supabase/server.ts`, no lee cookies. Eso es lo que
 * permite que las páginas públicas se generen de forma estática con ISR: usar
 * `cookies()` dentro de una página la fuerza a renderizado dinámico, y con ello
 * los `export const revalidate` quedaban sin efecto (cada visita ejecutaba el
 * render completo y sus queries).
 *
 * Usa la anon key, así que RLS sigue aplicando: solo expone las filas activas.
 * Para el panel se usa `lib/supabase/admin.ts` (service-role).
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
