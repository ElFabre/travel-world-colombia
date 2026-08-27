'use client'

import { useMemo, useState } from 'react'
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CampoReserva, ValorCampo } from '@/lib/admin/reservas'
import { guardarReserva } from '../actions'

/**
 * Wizard de reserva: un paso por carpeta del catálogo. Los campos numerados
 * (P1–P8 pasajeros, T1–T4 trayectos, Pago 1–4) se muestran como grupos
 * repetibles controlados por un contador — el representante nunca ve 48
 * campos planos.
 */

interface Props {
  opportunityId: string
  campos: CampoReserva[]
  valoresIniciales: Record<string, ValorCampo>
  prefill: Record<string, ValorCampo>
}

/** Prefijo de grupo: "P3 - Nombre" → "P3" · "Pago 2 - Fecha" → "Pago 2". */
function prefijoDe(nombre: string): string | null {
  const m = nombre.match(/^(.+?) - /)
  return m ? m[1] : null
}

/** Número del grupo repetible, si lo es: P3→3, T2→2, Pago 4→4. */
function numeroRepetible(prefijo: string): { serie: 'P' | 'T' | 'Pago'; n: number } | null {
  let m = prefijo.match(/^P(\d)$/)
  if (m) return { serie: 'P', n: Number(m[1]) }
  m = prefijo.match(/^T(\d)$/)
  if (m) return { serie: 'T', n: Number(m[1]) }
  m = prefijo.match(/^Pago (\d)$/)
  if (m) return { serie: 'Pago', n: Number(m[1]) }
  return null
}

const SERIE_LABEL = { P: 'Pasajero', T: 'Trayecto', Pago: 'Pago' } as const
const SERIE_MAX = { P: 8, T: 4, Pago: 4 } as const

const card: React.CSSProperties = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 12,
}

export function Wizard({ opportunityId, campos, valoresIniciales, prefill }: Props) {
  const pasos = useMemo(() => {
    const vistos: string[] = []
    for (const c of campos) if (!vistos.includes(c.folder)) vistos.push(c.folder)
    return vistos
  }, [campos])

  const [paso, setPaso] = useState(0)
  const [valores, setValores] = useState<Record<string, ValorCampo>>(() => ({
    ...prefill,
    ...valoresIniciales,
  }))
  // Ids cuyo valor vino sugerido del contacto y aún no se guarda: se pintan
  // distinto para que el representante los revise en vez de confiar a ciegas.
  const [sugeridos, setSugeridos] = useState<Set<string>>(
    () => new Set(Object.keys(prefill).filter(id => valoresIniciales[id] === undefined))
  )
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  // Cuántos pasajeros/trayectos/pagos se muestran: arranca en el mayor con datos.
  const [cuenta, setCuenta] = useState<Record<'P' | 'T' | 'Pago', number>>(() => {
    const con = { P: 1, T: 1, Pago: 1 }
    for (const c of campos) {
      const rep = prefijoDe(c.name) ? numeroRepetible(prefijoDe(c.name)!) : null
      if (rep && (valoresIniciales[c.ghlId] !== undefined || prefill[c.ghlId] !== undefined)) {
        con[rep.serie] = Math.max(con[rep.serie], rep.n)
      }
    }
    return con
  })

  const carpetaActual = pasos[paso]
  const camposDelPaso = campos.filter(c => c.folder === carpetaActual)

  // Grupos del paso: los repetibles visibles según el contador + los sueltos.
  const { grupos, sueltos, series } = useMemo(() => {
    const grupos = new Map<string, CampoReserva[]>()
    const sueltos: CampoReserva[] = []
    const series = new Set<'P' | 'T' | 'Pago'>()
    for (const c of camposDelPaso) {
      const pref = prefijoDe(c.name)
      const rep = pref ? numeroRepetible(pref) : null
      if (rep) {
        series.add(rep.serie)
        if (rep.n > cuenta[rep.serie]) continue // fuera del contador: oculto
      }
      if (pref && camposDelPaso.filter(x => prefijoDe(x.name) === pref).length >= 2) {
        if (!grupos.has(pref)) grupos.set(pref, [])
        grupos.get(pref)!.push(c)
      } else {
        sueltos.push(c)
      }
    }
    return { grupos, sueltos, series }
  }, [camposDelPaso, cuenta])

  function poner(id: string, v: ValorCampo) {
    setValores(prev => ({ ...prev, [id]: v }))
    setSugeridos(prev => {
      if (!prev.has(id)) return prev
      const s = new Set(prev)
      s.delete(id)
      return s
    })
  }

  async function guardarPaso(avanzar: boolean) {
    setGuardando(true)
    setAviso(null)
    try {
      // Se guarda TODO lo visible del paso con valor (PUT idempotente, GHL
      // hace merge): así los sugeridos revisados también quedan escritos.
      const visibles = [...grupos.values()].flat().concat(sueltos)
      const lote: Record<string, ValorCampo> = {}
      for (const c of visibles) {
        const v = valores[c.ghlId]
        if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) lote[c.ghlId] = v
      }
      const { guardados } = await guardarReserva(opportunityId, lote)
      setSugeridos(prev => {
        const s = new Set(prev)
        for (const id of Object.keys(lote)) s.delete(id)
        return s
      })
      setAviso({ ok: true, texto: guardados ? `${guardados} campos guardados en GHL.` : 'Nada nuevo que guardar.' })
      if (avanzar && paso < pasos.length - 1) setPaso(paso + 1)
    } catch (e) {
      setAviso({ ok: false, texto: `No se pudo guardar: ${(e as Error).message}` })
    } finally {
      setGuardando(false)
    }
  }

  function llenosEn(carpeta: string): number {
    return campos.filter(
      c =>
        c.folder === carpeta &&
        valores[c.ghlId] !== undefined &&
        valores[c.ghlId] !== '' &&
        !sugeridos.has(c.ghlId)
    ).length
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pasos */}
      <div className="flex flex-wrap gap-1.5">
        {pasos.map((p, i) => {
          const activo = i === paso
          const llenos = llenosEn(p)
          const total = campos.filter(c => c.folder === p).length
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPaso(i)}
              className="rounded-full px-3 py-1.5 font-inter text-xs transition-colors"
              style={{
                background: activo ? 'var(--orange)' : 'white',
                color: activo ? 'var(--orange-contrast)' : 'var(--text-dim)',
                border: '1px solid ' + (activo ? 'var(--orange)' : 'var(--border)'),
                fontWeight: activo ? 600 : 400,
              }}
            >
              {i + 1}. {p}
              {llenos > 0 && <span className="ml-1 opacity-70">({llenos}/{total})</span>}
            </button>
          )
        })}
      </div>

      <div className="p-5" style={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-inter text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {carpetaActual}
          </h2>

          {/* Contadores de grupos repetibles del paso */}
          <div className="flex gap-3">
            {[...series].map(s => (
              <label key={s} className="flex items-center gap-2 font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
                {s === 'P' ? '¿Cuántos pasajeros?' : s === 'T' ? '¿Cuántos trayectos?' : '¿Cuántos pagos?'}
                <select
                  value={cuenta[s]}
                  onChange={e => setCuenta(prev => ({ ...prev, [s]: Number(e.target.value) }))}
                  className="rounded-md px-2 py-1 font-inter text-xs"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {Array.from({ length: SERIE_MAX[s] }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        {sugeridos.size > 0 && (
          <p className="mb-4 rounded-md px-3 py-2 font-inter text-xs" style={{ background: '#fffbeb', color: '#92400e' }}>
            Los campos en amarillo vienen sugeridos del CRM (calificación de Sol / datos previos).
            Revísalos: al guardar el paso quedan escritos en la oportunidad.
          </p>
        )}

        {/* Campos sueltos */}
        {sueltos.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sueltos.map(c => (
              <Campo key={c.ghlId} campo={c} valor={valores[c.ghlId]} sugerido={sugeridos.has(c.ghlId)} onChange={poner} />
            ))}
          </div>
        )}

        {/* Grupos (pasajeros, trayectos, pagos, filas de liquidación) */}
        {[...grupos.entries()].map(([pref, items]) => {
          const rep = numeroRepetible(pref)
          const titulo = rep ? `${SERIE_LABEL[rep.serie]} ${rep.n}` : pref
          return (
            <fieldset
              key={pref}
              className="mt-4 rounded-lg p-4"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-alt)' }}
            >
              <legend className="px-2 font-inter text-xs font-semibold" style={{ color: 'var(--orange)' }}>
                {titulo}
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(c => (
                  <Campo key={c.ghlId} campo={c} valor={valores[c.ghlId]} sugerido={sugeridos.has(c.ghlId)} onChange={poner} />
                ))}
              </div>
            </fieldset>
          )
        })}

        {/* Acciones */}
        <div className="mt-6 flex flex-wrap items-center gap-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button
            type="button"
            disabled={paso === 0 || guardando}
            onClick={() => setPaso(paso - 1)}
            className="flex items-center gap-1 rounded-md px-3 py-2 font-inter text-sm disabled:opacity-40"
            style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            <ChevronLeft size={15} /> Anterior
          </button>

          <button
            type="button"
            disabled={guardando}
            onClick={() => guardarPaso(false)}
            className="flex items-center gap-2 rounded-md px-4 py-2 font-inter text-sm font-semibold disabled:opacity-60"
            style={{ border: '1px solid var(--border-orange)', color: 'var(--orange)' }}
          >
            {guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Guardar paso
          </button>

          <button
            type="button"
            disabled={guardando}
            onClick={() => guardarPaso(true)}
            className="flex items-center gap-1 rounded-md px-4 py-2 font-inter text-sm font-semibold disabled:opacity-60"
            style={{ background: 'var(--orange)', color: 'var(--orange-contrast)' }}
          >
            Guardar y seguir <ChevronRight size={15} />
          </button>

          {aviso && (
            <span className="font-inter text-sm" style={{ color: aviso.ok ? '#15803d' : '#b91c1c' }}>
              {aviso.texto}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** Un campo del formulario, según su dataType de GHL. */
function Campo({
  campo, valor, sugerido, onChange,
}: {
  campo: CampoReserva
  valor: ValorCampo | undefined
  sugerido: boolean
  onChange: (id: string, v: ValorCampo) => void
}) {
  // La etiqueta sin el prefijo del grupo ("P3 - Documento" → "Documento").
  const etiqueta = campo.name.replace(/^.+? - /, '')
  const base: React.CSSProperties = {
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    background: sugerido ? '#fffbeb' : 'white',
  }
  const clase = 'w-full rounded-md px-3 py-2 font-inter text-sm outline-none'

  return (
    <label className="block">
      <span className="mb-1 block font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
        {etiqueta}
      </span>

      {campo.dataType === 'LARGE_TEXT' ? (
        <textarea
          rows={3}
          value={(valor as string) ?? ''}
          onChange={e => onChange(campo.ghlId, e.target.value)}
          className={clase}
          style={base}
        />
      ) : campo.dataType === 'SINGLE_OPTIONS' ? (
        <select
          value={(valor as string) ?? ''}
          onChange={e => onChange(campo.ghlId, e.target.value)}
          className={clase}
          style={base}
        >
          <option value="">—</option>
          {(campo.options ?? []).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : campo.dataType === 'MULTIPLE_OPTIONS' ? (
        <div className="flex flex-col gap-1 rounded-md p-3" style={base}>
          {(campo.options ?? []).map(o => {
            const marcadas = Array.isArray(valor) ? valor : []
            const activa = marcadas.includes(o)
            return (
              <label key={o} className="flex items-center gap-2 font-inter text-sm" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={() =>
                    onChange(campo.ghlId, activa ? marcadas.filter(x => x !== o) : [...marcadas, o])
                  }
                />
                {o}
              </label>
            )
          })}
        </div>
      ) : (
        <input
          type={campo.dataType === 'DATE' ? 'date' : campo.dataType === 'NUMERICAL' ? 'number' : campo.dataType === 'PHONE' ? 'tel' : 'text'}
          step={campo.dataType === 'NUMERICAL' ? 'any' : undefined}
          value={(valor as string) ?? ''}
          onChange={e => onChange(campo.ghlId, e.target.value)}
          className={clase}
          style={base}
        />
      )}
    </label>
  )
}
