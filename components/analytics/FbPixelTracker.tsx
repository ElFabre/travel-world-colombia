'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { fbEvent, fbPageView } from '@/lib/analytics/fbpixel'

const WHATSAPP_RE = /wa\.me|api\.whatsapp\.com|web\.whatsapp\.com/i

/**
 * Complementa el script base del píxel (Analytics.tsx):
 * - PageView en cada navegación SPA — el script base solo cubre la carga inicial.
 * - Evento estándar `Contact` al hacer clic en cualquier enlace de WhatsApp,
 *   venga del botón flotante, el hero, el footer o una página de destino.
 */
export function FbPixelTracker() {
  const pathname = usePathname()
  const primeraCarga = useRef(true)

  useEffect(() => {
    // La carga inicial ya dispara PageView desde el script de init.
    if (primeraCarga.current) {
      primeraCarga.current = false
      return
    }
    fbPageView()
  }, [pathname])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.('a[href]')
      if (link && WHATSAPP_RE.test(link.getAttribute('href') ?? '')) {
        fbEvent('Contact', { content_name: window.location.pathname })
      }
    }
    // Captura para adelantarse a stopPropagation y a la navegación.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
