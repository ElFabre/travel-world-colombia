import type { NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { correrVigilancia } from '@/lib/agente/vigilante'
import { secretoRecibido } from '@/lib/agente/secreto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cada candidata implica 2 llamadas a GHL (contacto + mensajes). Con el tope por
 * corrida (80) el peor caso ronda el par de minutos. 120 s de margen.
 */
export const maxDuration = 120

/**
 * Runner del VIGILANTE de Sol: marca los leads que llevan más del SLA sin que
 * nadie responda (dentro del horario de atención) para que un workflow de GHL
 * avise al usuario asignado.
 *
 * Lo dispara el cron de Vercel (ver `vercel.json`) o una llamada manual con el
 * secreto. GET a propósito: es lo que envía el cron. Idempotente: una segunda
 * llamada seguida no vuelve a marcar lo ya marcado.
 */

function autorizado(req: NextRequest): boolean {
  const igual = (recibido: string, esperado?: string) => {
    if (!esperado || !recibido) return false
    const a = Buffer.from(recibido)
    const b = Buffer.from(esperado)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (igual(bearer, process.env.CRON_SECRET)) return true

  return igual(secretoRecibido(req), process.env.AGENTE_WEBHOOK_SECRET)
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return Response.json({ ok: false }, { status: 401 })

  try {
    // `?dry=1` calcula y reporta qué haría, SIN escribir tags. Para probar seguro.
    const dry = req.nextUrl.searchParams.get('dry') === '1'
    const resumen = await correrVigilancia({ dry })
    return Response.json({ ok: true, ...resumen })
  } catch (err) {
    console.error('correrVigilancia error:', err)
    return Response.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
