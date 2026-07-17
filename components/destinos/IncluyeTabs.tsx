'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

type Tab = 'incluye' | 'no_incluye'

function TabBtn({ activa, label, onClick }: { activa: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className="group relative pb-3 font-plus-jakarta text-sm font-bold uppercase tracking-widest transition-opacity"
      style={{ color: '#fff', opacity: activa ? 1 : 0.4 }}
    >
      {label}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 mx-auto block h-[3px] w-24 max-w-full rounded-sm transition-opacity"
        style={{ background: 'var(--orange)', opacity: activa ? 1 : 0 }}
      />
    </button>
  )
}

/**
 * "¿Qué incluye tu viaje?" con pestañas: INCLUYE / NO INCLUYE. La lista activa
 * se muestra en una tarjeta translúcida a dos columnas con checks verdes (o
 * equis rojas). Si una de las dos listas viene vacía, no se muestran pestañas.
 */
export function IncluyeTabs({ incluye = [], noIncluye = [] }: { incluye?: string[]; noIncluye?: string[] }) {
  const [tab, setTab] = useState<Tab>(incluye.length ? 'incluye' : 'no_incluye')
  const conTabs = incluye.length > 0 && noIncluye.length > 0

  const items = tab === 'incluye' ? incluye : noIncluye
  const esIncluye = tab === 'incluye'
  // Dos columnas balanceadas conservando el orden (primera mitad a la izquierda).
  const mitad = Math.ceil(items.length / 2)
  const columnas = [items.slice(0, mitad), items.slice(mitad)]

  return (
    <div>
      {conTabs && (
        <nav role="tablist" aria-label="Qué incluye el paquete" className="mb-10 flex justify-center gap-12">
          <TabBtn activa={tab === 'incluye'} label="Incluye" onClick={() => setTab('incluye')} />
          <TabBtn activa={tab === 'no_incluye'} label="No incluye" onClick={() => setTab('no_incluye')} />
        </nav>
      )}

      <div
        role="tabpanel"
        className="rounded-2xl p-8 md:p-12"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
          {columnas.map((col, c) => (
            <ul key={`${tab}-${c}`} className="space-y-6">
              {col.map(item => (
                <li key={item} className="flex items-start gap-4">
                  {esIncluye ? (
                    <Check size={20} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: '#4ade80' }} />
                  ) : (
                    <X size={20} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: '#f87171' }} />
                  )}
                  <span
                    className="font-inter text-[15px] leading-relaxed"
                    style={{ color: esIncluye ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)' }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
