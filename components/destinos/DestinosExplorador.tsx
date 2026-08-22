'use client'

import { useMemo, useState } from 'react'
import { MapPin, Globe } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { DestinoCard } from './DestinoCard'

type Filtro = 'todos' | 'nacional' | 'internacional' | 'favoritos' | 'fin_ano'

const esNacional = (d: Destino) => d.pais === 'Colombia'
const minOrden = (ds: Destino[]) => Math.min(...ds.map(d => d.orden))

const TRANSP_LABEL: Record<string, string> = { bus: '🚌 En bus', avion: '✈️ En avión', otros: 'Otros planes nacionales' }
const TRANSP_ORDEN: Record<string, number> = { bus: 0, avion: 1, otros: 2 }

/** Agrupa manteniendo el orden de inserción; devuelve [clave, destinos][]. */
function agrupar(items: Destino[], clave: (d: Destino) => string): [string, Destino[]][] {
  const m = new Map<string, Destino[]>()
  for (const d of items) {
    const k = clave(d)
    const lista = m.get(k)
    if (lista) lista.push(d)
    else m.set(k, [d])
  }
  return [...m.entries()]
}

function Grid({ destinos }: { destinos: Destino[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {destinos.map((d, i) => (
        <DestinoCard key={d.id} d={d} i={i} />
      ))}
    </ul>
  )
}

function Caja({ icon, titulo, total, children }: { icon: React.ReactNode; titulo: string; total: number; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-5 sm:p-8" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', color: 'var(--orange)' }}>
          {icon}
        </span>
        <h2 className="font-plus-jakarta text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
          {titulo}
        </h2>
        <span className="rounded-full px-3 py-1 font-inter text-[11px] font-bold" style={{ background: 'color-mix(in srgb, var(--orange) 10%, transparent)', color: 'var(--orange)' }}>
          {total} programa{total !== 1 ? 's' : ''}
        </span>
        <div aria-hidden className="hidden h-px flex-1 sm:block" style={{ background: 'var(--border)' }} />
      </header>
      {children}
    </section>
  )
}

function SubGrupo({ titulo, destinos }: { titulo: string; destinos: Destino[] }) {
  return (
    <div className="mb-8 last:mb-0">
      <h3 className="mb-3 font-plus-jakarta text-sm font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-dim)' }}>
        {titulo}
      </h3>
      <Grid destinos={destinos} />
    </div>
  )
}

/** Colombia: una caja, sub-grupos por transporte (bus / avión). */
function SeccionNacional({ destinos }: { destinos: Destino[] }) {
  const grupos = agrupar(destinos, d => d.transporte ?? 'otros').sort(
    (a, b) => (TRANSP_ORDEN[a[0]] ?? 9) - (TRANSP_ORDEN[b[0]] ?? 9)
  )
  const soloSinEtiqueta = grupos.length === 1 && grupos[0][0] === 'otros'
  return (
    <Caja icon={<MapPin size={18} />} titulo="Colombia" total={destinos.length}>
      {soloSinEtiqueta ? (
        <Grid destinos={destinos} />
      ) : (
        grupos.map(([k, lista]) => <SubGrupo key={k} titulo={TRANSP_LABEL[k] ?? 'Otros planes'} destinos={lista} />)
      )}
    </Caja>
  )
}

/** Internacional: una caja por región/continente, sub-grupos por país. */
function SeccionInternacional({ destinos }: { destinos: Destino[] }) {
  const regiones = agrupar(destinos, d => d.region ?? 'Otros destinos').sort(
    (a, b) => minOrden(a[1]) - minOrden(b[1])
  )
  return (
    <>
      {regiones.map(([region, lista]) => {
        const paises = agrupar(lista, d => d.pais).sort((a, b) => minOrden(a[1]) - minOrden(b[1]))
        return (
          <Caja key={region} icon={<Globe size={18} />} titulo={region} total={lista.length}>
            {paises.length <= 1
              ? <Grid destinos={lista} />
              : paises.map(([pais, ds]) => <SubGrupo key={pais} titulo={pais} destinos={ds} />)}
          </Caja>
        )
      })}
    </>
  )
}

export function DestinosExplorador({ destinos }: { destinos: Destino[] }) {
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const { nacionales, internacionales, favoritos, finAno } = useMemo(() => ({
    nacionales: destinos.filter(esNacional),
    internacionales: destinos.filter(d => !esNacional(d)),
    favoritos: destinos.filter(d => d.destacado),
    finAno: destinos.filter(d => d.salida_fin_ano),
  }), [destinos])

  const chips = ([
    { key: 'todos', label: 'Todos', n: destinos.length },
    { key: 'nacional', label: '🇨🇴 Nacionales', n: nacionales.length },
    { key: 'internacional', label: '🌎 Internacionales', n: internacionales.length },
    { key: 'favoritos', label: '⭐ Favoritos', n: favoritos.length },
    { key: 'fin_ano', label: '🎄 Salidas fin de año', n: finAno.length },
  ] as const).filter(c => c.n > 0 || c.key === 'todos')

  if (destinos.length === 0) {
    return (
      <p className="py-20 text-center font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
        No hay destinos disponibles por el momento.
      </p>
    )
  }

  const verNacional = filtro === 'todos' || filtro === 'nacional'
  const verInternacional = filtro === 'todos' || filtro === 'internacional'

  return (
    <div>
      {/* Filtros */}
      <div className="mb-10 flex flex-wrap gap-2">
        {chips.map(c => {
          const activo = filtro === c.key
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFiltro(c.key)}
              className="rounded-full px-5 py-2 font-plus-jakarta text-[11px] font-bold tracking-[0.12em] uppercase transition-all duration-200"
              style={
                activo
                  ? { background: 'var(--orange)', color: 'var(--orange-contrast)', border: '1px solid var(--orange)' }
                  : { background: 'var(--bg-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)' }
              }
            >
              {c.label} · {c.n}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-10">
        {filtro === 'favoritos' && <Grid destinos={favoritos} />}
        {filtro === 'fin_ano' && <Grid destinos={finAno} />}
        {verNacional && nacionales.length > 0 && <SeccionNacional destinos={nacionales} />}
        {verInternacional && internacionales.length > 0 && <SeccionInternacional destinos={internacionales} />}
      </div>
    </div>
  )
}
