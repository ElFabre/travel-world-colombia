'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/** Botón pequeño que copia un texto (número de cuenta, correo) al portapapeles. */
export function BotonCopiar({ texto, etiqueta = 'Copiar' }: { texto: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso de portapapeles (http, iframes): el usuario copia a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-plus-jakarta text-[11px] font-bold uppercase tracking-wide transition-all duration-200"
      style={
        copiado
          ? { background: 'color-mix(in srgb, #10b981 15%, transparent)', color: '#059669', border: '1px solid #10b981' }
          : { background: 'var(--bg-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)' }
      }
      aria-live="polite"
    >
      {copiado ? <Check size={13} /> : <Copy size={13} />}
      {copiado ? 'Copiado' : etiqueta}
    </button>
  )
}
