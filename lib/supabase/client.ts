'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // SameSite=None para sobrevivir dentro del iframe de GHL — ver
      // lib/supabase/server.ts (los tres clientes deben coincidir).
      cookieOptions: { sameSite: 'none', secure: true },
    }
  )
}
