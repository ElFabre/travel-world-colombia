'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, ChevronRight, User, Phone, Mail } from 'lucide-react'
import {
  buscarClientes,
  listarOportunidades,
  type ClienteEncontrado,
  type OportunidadListada,
} from './actions'

const card: React.CSSProperties = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 12,
}

export function Buscador() {
  const [q, setQ] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [clientes, setClientes] = useState<ClienteEncontrado[] | null>(null)
  const [elegido, setElegido] = useState<ClienteEncontrado | null>(null)
  const [oportunidades, setOportunidades] = useState<OportunidadListada[] | null>(null)
  const [cargandoOps, setCargandoOps] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Búsqueda con debounce: se dispara sola al escribir 3+ caracteres.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    setError(null)
    if (q.trim().length < 3) {
      setClientes(null)
      setBuscando(false)
      return
    }
    setBuscando(true)
    timer.current = setTimeout(async () => {
      try {
        setClientes(await buscarClientes(q))
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBuscando(false)
      }
    }, 400)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q])

  async function elegirCliente(c: ClienteEncontrado) {
    setElegido(c)
    setOportunidades(null)
    setError(null)
    setCargandoOps(true)
    try {
      setOportunidades(await listarOportunidades(c.id))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCargandoOps(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="p-5" style={card}>
        <label className="mb-2 block font-inter text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          ¿A qué cliente le vas a llenar la reserva?
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Nombre, teléfono o correo (mínimo 3 letras)…"
            autoFocus
            className="w-full rounded-md py-2.5 pl-9 pr-3 font-inter text-sm outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          {buscando && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: 'var(--text-muted)' }} />
          )}
        </div>

        {clientes !== null && (
          <ul className="mt-3 flex flex-col gap-1">
            {clientes.length === 0 && !buscando && (
              <li className="px-2 py-3 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
                Sin resultados. Prueba con otra parte del nombre o el número.
              </li>
            )}
            {clientes.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => elegirCliente(c)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-inter text-sm transition-colors"
                  style={{
                    border: '1px solid ' + (elegido?.id === c.id ? 'var(--border-orange)' : 'transparent'),
                    background: elegido?.id === c.id ? 'rgba(255,170,0,0.07)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <User size={15} style={{ color: 'var(--orange)' }} />
                  <span className="font-medium">{c.nombre}</span>
                  {c.telefono && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                      <Phone size={11} /> {c.telefono}
                    </span>
                  )}
                  {c.email && (
                    <span className="hidden items-center gap-1 text-xs sm:flex" style={{ color: 'var(--text-dim)' }}>
                      <Mail size={11} /> {c.email}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {elegido && (
        <div className="p-5" style={card}>
          <h2 className="mb-3 font-inter text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Oportunidades de {elegido.nombre}
          </h2>

          {cargandoOps && (
            <p className="flex items-center gap-2 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
              <Loader2 size={14} className="animate-spin" /> Buscando en GHL…
            </p>
          )}

          {oportunidades !== null && oportunidades.length === 0 && (
            <p className="font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
              Este cliente no tiene oportunidades. La tarjeta se crea sola cuando el lead
              entra al pipeline — si falta, revisa el workflow &quot;1.-Lead nuevo&quot; en GHL.
            </p>
          )}

          {oportunidades !== null && oportunidades.length > 0 && (
            <ul className="flex flex-col gap-2">
              {oportunidades.map(o => (
                <li key={o.id}>
                  <Link
                    href={`/admin/reservas/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-md px-4 py-3 font-inter text-sm transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <span>
                      <span className="font-medium">{o.nombre}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                        {o.pipeline} · {o.etapa}
                        {o.status && o.status !== 'open' ? ` · ${o.status}` : ''}
                      </span>
                    </span>
                    <ChevronRight size={16} style={{ color: 'var(--orange)' }} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md px-4 py-3 font-inter text-sm" style={{ background: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </p>
      )}
    </div>
  )
}
