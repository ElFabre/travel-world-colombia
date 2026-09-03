'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MapPin, Globe, X } from 'lucide-react'
import type { Destino } from '@/types/destino'
import { DestinoCard } from './DestinoCard'
import { MapaDestinos, type SeleccionMapa } from './MapaDestinos'
import { CategoriasDestinos, grupos as gruposCategorias } from './CategoriasDestinos'

/**
 * Filtro único del explorador. Vive en la URL (?f=...) para que las tarjetas
 * de categorías, el mapa y los enlaces externos apliquen el mismo estado y la
 * vista filtrada sea compartible. `transporte:` implica nacional (bus/avión/
 * otros); `pais:` y `region:` son internacionales.
 */
export type Filtro =
  | 'todos'
  | 'nacional'
  | 'favoritos'
  | 'fin_ano'
  | `region:${string}`
  | `pais:${string}`
  | `transporte:${string}`

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

/** Valida el ?f= de la URL contra los datos reales; lo desconocido cae a 'todos'. */
function normalizarFiltro(raw: string | null, regiones: Set<string>, paises: Set<string>): Filtro {
  if (raw === 'nacional' || raw === 'favoritos' || raw === 'fin_ano') return raw
  if (raw?.startsWith('region:') && regiones.has(raw.slice(7))) return raw as Filtro
  if (raw?.startsWith('pais:') && paises.has(raw.slice(5))) return raw as Filtro
  if (raw?.startsWith('transporte:') && ['bus', 'avion', 'otros'].includes(raw.slice(11))) return raw as Filtro
  return 'todos'
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

/**
 * Internacional: una caja por región/continente, con TODAS sus tarjetas en una
 * sola grilla (3 por fila) para agruparlas horizontalmente. Se ordenan por país
 * (mismo país queda adyacente) respetando el orden del panel; el país se ve en
 * cada tarjeta.
 */
function SeccionInternacional({ destinos }: { destinos: Destino[] }) {
  const regiones = agrupar(destinos, d => d.region ?? 'Otros destinos').sort(
    (a, b) => minOrden(a[1]) - minOrden(b[1])
  )
  return (
    <>
      {regiones.map(([region, lista]) => {
        const ordenados = agrupar(lista, d => d.pais)
          .sort((a, b) => minOrden(a[1]) - minOrden(b[1]))
          .flatMap(([, ds]) => [...ds].sort((a, b) => a.orden - b.orden))
        return (
          <Caja key={region} icon={<Globe size={18} />} titulo={region} total={lista.length}>
            <Grid destinos={ordenados} />
          </Caja>
        )
      })}
    </>
  )
}

export function DestinosExplorador({ destinos }: { destinos: Destino[] }) {
  const searchParams = useSearchParams()
  // Fallback de estado para entornos sin sync del History API (no debería
  // ocurrir en App Router, pero garantiza que la UI siempre reaccione al clic).
  const [filtroLocal, setFiltroLocal] = useState<Filtro | null>(null)

  const { nacionales, internacionales, favoritos, finAno } = useMemo(() => ({
    nacionales: destinos.filter(esNacional),
    internacionales: destinos.filter(d => !esNacional(d)),
    favoritos: destinos.filter(d => d.destacado),
    finAno: destinos.filter(d => d.salida_fin_ano),
  }), [destinos])

  // País → { conteo, región } (solo internacionales) para el mapa por país.
  const conteoPaises = useMemo(() => {
    const m = new Map<string, { n: number; region: string }>()
    for (const d of internacionales) {
      const e = m.get(d.pais)
      if (e) e.n += 1
      else m.set(d.pais, { n: 1, region: d.region ?? 'Otros destinos' })
    }
    return m
  }, [internacionales])

  const regionesSet = useMemo(
    () => new Set(internacionales.map(d => d.region ?? 'Otros destinos')),
    [internacionales]
  )

  const filtro = filtroLocal ?? normalizarFiltro(searchParams.get('f'), regionesSet, new Set(conteoPaises.keys()))

  /**
   * Cambia el filtro y lo refleja en la URL con el History API nativo (shallow:
   * sin ronda al servidor). `scrollAResultados` acerca el listado tras elegir
   * una tarjeta de categoría o un país del mapa.
   */
  const setFiltro = (f: Filtro, scrollAResultados = false) => {
    setFiltroLocal(f)
    const url = f === 'todos' ? window.location.pathname : `${window.location.pathname}?f=${encodeURIComponent(f)}`
    window.history.replaceState(null, '', url)
    if (scrollAResultados && f !== 'todos') {
      document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const grupos = useMemo(() => gruposCategorias(destinos), [destinos])

  const regionSel = filtro.startsWith('region:') ? filtro.slice(7) : null
  const paisSel = filtro.startsWith('pais:') ? filtro.slice(5) : null
  const transpSel = filtro.startsWith('transporte:') ? filtro.slice(11) : null

  // El mapa entiende 'nacional', pais: y region: (region llega de las tarjetas
  // y solo tiñe los países de esa zona).
  const seleccionMapa: SeleccionMapa =
    filtro === 'nacional' || filtro.startsWith('pais:') || filtro.startsWith('region:')
      ? (filtro as SeleccionMapa)
      : null

  // Facetas transversales que ni las tarjetas ni el mapa expresan. Cada chip es
  // un toggle (clic estando activo → volver a todos).
  const chips = ([
    { key: 'favoritos', label: '⭐ Favoritos', n: favoritos.length },
    { key: 'fin_ano', label: '🎄 Salidas fin de año', n: finAno.length },
  ] as const).filter(c => c.n > 0)

  const nacionalesDeTransp = transpSel
    ? nacionales.filter(d => (d.transporte ?? 'otros') === transpSel)
    : []
  const destinosDePais = paisSel
    ? internacionales.filter(d => d.pais === paisSel).sort((a, b) => a.orden - b.orden)
    : []

  // Etiqueta del chip "limpiar filtro" cuando la selección vino de tarjeta/mapa.
  const etiquetaLimpiar = regionSel
    ? `📍 ${regionSel} · ${internacionales.filter(d => (d.region ?? 'Otros destinos') === regionSel).length}`
    : paisSel
      ? `📍 ${paisSel} · ${destinosDePais.length}`
      : transpSel
        ? `${TRANSP_LABEL[transpSel] ?? 'Colombia'} · ${nacionalesDeTransp.length}`
        : filtro === 'nacional'
          ? `🇨🇴 Colombia · ${nacionales.length}`
          : null

  if (destinos.length === 0) {
    return (
      <p className="py-20 text-center font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
        No hay destinos disponibles por el momento.
      </p>
    )
  }

  const verNacional = filtro === 'todos' || filtro === 'nacional'
  const verInternacional = filtro === 'todos'

  return (
    <div>
      {/* Tarjetas de categorías (pedido del cliente): navegación rápida por
          transporte, región y país; aplican el mismo filtro que el mapa. */}
      <CategoriasDestinos grupos={grupos} filtro={filtro} onSelect={f => setFiltro(f, f !== 'todos')} />

      {/* Mapa interactivo por país (en móvil se muestra también) */}
      <div className="mx-auto mb-8 max-w-3xl">
        <MapaDestinos
          paises={conteoPaises}
          nacionales={nacionales.length}
          seleccion={seleccionMapa}
          onSelect={sel => setFiltro(sel ?? 'todos', sel !== null)}
        />
      </div>

      {/* Facetas transversales + chip para limpiar la selección activa */}
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {etiquetaLimpiar && (
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className="flex items-center gap-1.5 rounded-full px-5 py-2 font-plus-jakarta text-[11px] font-bold tracking-[0.12em] uppercase transition-all duration-200"
            style={{ background: 'var(--orange)', color: 'var(--orange-contrast)', border: '1px solid var(--orange)' }}
          >
            {etiquetaLimpiar} <X size={12} />
          </button>
        )}
        {chips.map(c => {
          const activo = filtro === c.key
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFiltro(activo ? 'todos' : c.key)}
              className="flex items-center gap-1.5 rounded-full px-5 py-2 font-plus-jakarta text-[11px] font-bold tracking-[0.12em] uppercase transition-all duration-200"
              style={
                activo
                  ? { background: 'var(--orange)', color: 'var(--orange-contrast)', border: '1px solid var(--orange)' }
                  : { background: 'var(--bg-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)' }
              }
            >
              {c.label} · {c.n} {activo && <X size={12} />}
            </button>
          )
        })}
      </div>

      <div id="resultados" className="flex flex-col gap-10 scroll-mt-24">
        {filtro === 'favoritos' && <Grid destinos={favoritos} />}
        {filtro === 'fin_ano' && <Grid destinos={finAno} />}
        {regionSel && (
          <SeccionInternacional
            destinos={internacionales.filter(d => (d.region ?? 'Otros destinos') === regionSel)}
          />
        )}
        {paisSel && destinosDePais.length > 0 && (
          <Caja icon={<Globe size={18} />} titulo={paisSel} total={destinosDePais.length}>
            <Grid destinos={destinosDePais} />
          </Caja>
        )}
        {transpSel && nacionalesDeTransp.length > 0 && <SeccionNacional destinos={nacionalesDeTransp} />}
        {verNacional && nacionales.length > 0 && <SeccionNacional destinos={nacionales} />}
        {verInternacional && internacionales.length > 0 && <SeccionInternacional destinos={internacionales} />}
      </div>
    </div>
  )
}
