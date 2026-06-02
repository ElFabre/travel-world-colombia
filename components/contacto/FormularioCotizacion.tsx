'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'
import {
  cotizacionSchema,
  type CotizacionInput,
  PRESUPUESTO_OPCIONES,
  MESES,
} from '@/lib/validations/cotizacion'
import { submitCotizacion } from '@/app/contacto/actions'
import { whatsappUrl } from '@/lib/site'
import type { Destino } from '@/types/destino'

interface Props {
  destinos: Destino[]
}

const currentYear = new Date().getFullYear()
const AÑOS = [currentYear, currentYear + 1, currentYear + 2].map(String)

const inputBase =
  'w-full rounded-md px-4 py-3 font-inter text-sm outline-none transition-all duration-200 bg-[rgba(255,255,255,0.06)] border text-white placeholder:text-[rgba(255,255,255,0.3)]'
const inputNormal = 'border-[rgba(255,255,255,0.12)] focus:border-[#f4821f] focus:bg-[rgba(244,130,31,0.06)]'
const inputError  = 'border-red-500/60 focus:border-red-400'
const labelBase   = 'block font-plus-jakarta text-[11px] font-bold tracking-[0.12em] uppercase mb-2'

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 font-inter text-[11px] text-red-400">
      <AlertCircle size={11} /> {msg}
    </p>
  )
}

export function FormularioCotizacion({ destinos }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CotizacionInput>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: { num_viajeros: 1 },
  })

  const onSubmit = async (data: CotizacionInput) => {
    setStatus('loading')
    const result = await submitCotizacion(data)
    if (result.ok) {
      setStatus('success')
    } else {
      setErrorMsg(result.message)
      setStatus('error')
    }
  }

  /* ── Estado éxito ── */
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 rounded-xl py-16 px-8 text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <CheckCircle size={52} style={{ color: '#22c55e' }} strokeWidth={1.5} />
        <div>
          <h3 className="font-plus-jakarta text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ¡Recibimos tu solicitud!
          </h3>
          <p className="mt-3 font-inter text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-dim)' }}>
            En menos de 24 horas un asesor se pondrá en contacto contigo.
            Si prefieres respuesta inmediata, escríbenos por WhatsApp.
          </p>
        </div>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md px-6 py-3 font-plus-jakarta text-[11px] font-bold tracking-[0.12em] uppercase text-white transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
        >
          Escribir por WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Honeypot */}
      <input {...register('website')} type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      {/* Fila 1: Nombre + WhatsApp */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className={labelBase} style={{ color: 'var(--text-dim)' }}>
            Nombre completo *
          </label>
          <input
            id="nombre"
            type="text"
            placeholder="Ej. María García"
            autoComplete="name"
            className={`${inputBase} ${errors.nombre ? inputError : inputNormal}`}
            {...register('nombre')}
          />
          <FieldError msg={errors.nombre?.message} />
        </div>

        <div>
          <label htmlFor="whatsapp" className={labelBase} style={{ color: 'var(--text-dim)' }}>
            WhatsApp *
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 font-inter text-sm select-none"
              style={{ color: 'var(--text-dim)' }}
            >
              +57
            </span>
            <input
              id="whatsapp"
              type="tel"
              placeholder="3001234567"
              autoComplete="tel"
              maxLength={10}
              className={`${inputBase} pl-12 ${errors.whatsapp ? inputError : inputNormal}`}
              {...register('whatsapp')}
            />
          </div>
          <FieldError msg={errors.whatsapp?.message} />
        </div>
      </div>

      {/* Fila 2: Destino + Viajeros */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="destino_interes" className={labelBase} style={{ color: 'var(--text-dim)' }}>
            Destino de interés *
          </label>
          <select
            id="destino_interes"
            className={`${inputBase} ${errors.destino_interes ? inputError : inputNormal} cursor-pointer`}
            style={{ appearance: 'none' }}
            {...register('destino_interes')}
          >
            <option value="" style={{ background: '#0a1628' }}>Selecciona un destino</option>
            {destinos.map(d => (
              <option key={d.id} value={d.nombre} style={{ background: '#0a1628' }}>
                {d.nombre} — {d.pais}
              </option>
            ))}
            <option value="Otro destino" style={{ background: '#0a1628' }}>Otro destino</option>
          </select>
          <FieldError msg={errors.destino_interes?.message} />
        </div>

        <div>
          <label htmlFor="num_viajeros" className={labelBase} style={{ color: 'var(--text-dim)' }}>
            Número de viajeros *
          </label>
          <select
            id="num_viajeros"
            className={`${inputBase} ${errors.num_viajeros ? inputError : inputNormal} cursor-pointer`}
            style={{ appearance: 'none' }}
            {...register('num_viajeros')}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n} style={{ background: '#0a1628' }}>
                {n} {n === 1 ? 'viajero' : 'viajeros'}
              </option>
            ))}
          </select>
          <FieldError msg={errors.num_viajeros?.message} />
        </div>
      </div>

      {/* Fila 3: Fechas tentativas */}
      <div>
        <p className={labelBase} style={{ color: 'var(--text-dim)' }}>
          Fechas tentativas *
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <select
              id="fecha_mes"
              aria-label="Mes de viaje"
              className={`${inputBase} ${errors.fecha_mes ? inputError : inputNormal} cursor-pointer`}
              style={{ appearance: 'none' }}
              {...register('fecha_mes')}
            >
              <option value="" style={{ background: '#0a1628' }}>Mes</option>
              {MESES.map(m => (
                <option key={m} value={m} style={{ background: '#0a1628' }}>{m}</option>
              ))}
            </select>
            <FieldError msg={errors.fecha_mes?.message} />
          </div>
          <div>
            <select
              id="fecha_año"
              aria-label="Año de viaje"
              className={`${inputBase} ${errors.fecha_año ? inputError : inputNormal} cursor-pointer`}
              style={{ appearance: 'none' }}
              {...register('fecha_año')}
            >
              <option value="" style={{ background: '#0a1628' }}>Año</option>
              {AÑOS.map(a => (
                <option key={a} value={a} style={{ background: '#0a1628' }}>{a}</option>
              ))}
            </select>
            <FieldError msg={errors.fecha_año?.message} />
          </div>
        </div>
      </div>

      {/* Fila 4: Presupuesto */}
      <fieldset>
        <legend className={`${labelBase} mb-3`} style={{ color: 'var(--text-dim)' }}>
          Presupuesto aproximado *
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRESUPUESTO_OPCIONES.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 transition-all duration-200"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
            >
              <input
                type="radio"
                value={value}
                className="accent-orange-500 h-4 w-4 shrink-0 cursor-pointer"
                {...register('presupuesto')}
              />
              <span className="font-inter text-xs leading-snug" style={{ color: 'var(--text-dim)' }}>
                {label}
              </span>
            </label>
          ))}
        </div>
        <FieldError msg={errors.presupuesto?.message} />
      </fieldset>

      {/* Fila 5: Mensaje */}
      <div>
        <label htmlFor="mensaje" className={labelBase} style={{ color: 'var(--text-dim)' }}>
          Mensaje adicional
          <span className="ml-2 normal-case font-inter font-normal tracking-normal" style={{ color: 'var(--text-muted)' }}>
            (opcional)
          </span>
        </label>
        <textarea
          id="mensaje"
          rows={4}
          placeholder="Cuéntanos sobre tu viaje ideal, fechas específicas, preferencias especiales..."
          className={`${inputBase} resize-none ${errors.mensaje ? inputError : inputNormal}`}
          {...register('mensaje')}
        />
        <FieldError msg={errors.mensaje?.message} />
      </div>

      {/* Error global */}
      {status === 'error' && (
        <div
          className="flex items-start gap-3 rounded-md px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="font-inter text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex items-center justify-center gap-2 rounded-md px-8 py-4 font-plus-jakarta text-[11px] font-bold tracking-[0.15em] uppercase text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(135deg, #f4821f, #e06b10)', boxShadow: '0 8px 24px rgba(244,130,31,0.4)' }}
      >
        {status === 'loading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <Send size={15} />
            Solicitar cotización gratis
          </>
        )}
      </button>

      <p className="text-center font-inter text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Tus datos están seguros. Respuesta en menos de 24 horas.
      </p>
    </form>
  )
}
