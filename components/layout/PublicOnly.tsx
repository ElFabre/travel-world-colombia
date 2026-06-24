'use client'

import { usePathname } from 'next/navigation'

/**
 * Oculta su contenido en el panel admin. El backend (/admin) no debe mostrar
 * el chrome del sitio público (navbar, footer, botón de WhatsApp).
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}
