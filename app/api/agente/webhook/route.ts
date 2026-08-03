import { after } from 'next/server'
import type { NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { eventoGhlSchema, normalizar } from '@/lib/agente/schemas'
import { identificarAutor } from '@/lib/agente/autor'
import { registrarEvento } from '@/lib/agente/eventos'
import { enriquecerDesdeContacto } from '@/lib/agente/enriquecer'
import { TAGS } from '@/lib/agente/config'
import { atender } from '@/lib/agente/conversacion'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Webhook del agente Sol — FASE 1: escucha y registra, NO responde a nadie.
 *
 * Objetivo de esta fase: con tráfico real, confirmar la forma del payload de
 * GHL y que sepamos distinguir quién escribió (cliente / Sol / bot actual /
 * asesora). Hasta validar eso, el agente no tiene voz.
 *
 * Contrato con GHL: responder 200 de inmediato. El trabajo va en `after()`,
 * que corre cuando la respuesta ya salió, para no arriesgar el timeout del
 * webhook (GHL reintenta y duplicaría eventos).
 */

function secretoValido(req: NextRequest): boolean {
  const esperado = process.env.AGENTE_WEBHOOK_SECRET
  if (!esperado) return false // sin secreto configurado, nadie entra

  const recibido =
    req.headers.get('x-sol-secret') ??
    req.nextUrl.searchParams.get('secret') ??
    ''

  // Comparación de tiempo constante (evita descubrir el secreto midiendo).
  const a = Buffer.from(recibido)
  const b = Buffer.from(esperado)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  if (!secretoValido(req)) {
    return Response.json({ ok: false }, { status: 401 })
  }

  let crudo: unknown
  try {
    crudo = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'cuerpo no es JSON' }, { status: 400 })
  }

  // El procesamiento va después de responder. Devolvemos 200 ya.
  after(async () => {
    const parsed = eventoGhlSchema.safeParse(crudo)

    if (!parsed.success) {
      // Ni así lo descartamos: guardar el crudo es el objetivo de esta fase.
      await registrarEvento({
        autor: 'desconocido',
        payload: crudo,
        nota: `no coincide con el esquema: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`,
      })
      return
    }

    const n = normalizar(parsed.data)

    // Compuerta barata: la acción gratuita ya manda los tags, así que a un
    // proveedor o mayorista se le cierra la puerta SIN gastar una sola llamada
    // a la API (ni al modelo, cuando Sol tenga voz).
    const esNoCliente = n.tags.some(t => (TAGS.noCliente as readonly string[]).includes(t))
    if (esNoCliente) {
      await registrarEvento({
        tipo: n.tipo,
        conversationId: n.conversationId,
        contactId: n.contactId,
        messageId: n.messageId,
        direccion: n.direccion,
        canal: n.canal,
        cuerpo: n.cuerpo,
        autor: 'cliente',
        payload: { webhook: crudo, mensaje: null, tags: n.tags },
        nota: 'NO CLIENTE (proveedor/mayorista) · descartado por tags, sin llamar a la API',
      })
      return
    }

    // Falta la dirección y la huella del autor: eso solo está en la API.
    const extra = n.contactId ? await enriquecerDesdeContacto(n.contactId) : null

    const direccion = n.direccion ?? extra?.direccion
    const messageId = n.messageId ?? extra?.messageId

    const { autor, nota } = await identificarAutor({
      direccion,
      messageId,
      // La huella del bot actual viene en el mensaje real, no en el webhook.
      payload: extra?.mensajeCrudo ?? crudo,
    })

    const tags = n.tags.length ? n.tags : (extra?.tagsContacto ?? [])
    const conversationId = n.conversationId ?? extra?.conversationId

    // Solo los mensajes del cliente disparan un turno de Sol.
    let notaTurno: string | null = null
    if (autor === 'cliente' && n.contactId && conversationId) {
      try {
        const turno = await atender({
          contactId: n.contactId,
          conversationId,
          nombre: n.nombreContacto,
          canal: n.canal ?? extra?.canal,
          tags,
          fechaMensaje: extra?.mensajeCrudo?.dateAdded
            ? new Date(extra.mensajeCrudo.dateAdded)
            : new Date(),
        })
        notaTurno = `SOL → ${turno.nota}`
      } catch (err) {
        notaTurno = `SOL falló: ${(err as Error).message}`
        console.error('atender error:', err)
      }
    }

    await registrarEvento({
      tipo: n.tipo,
      conversationId,
      contactId: n.contactId,
      messageId,
      direccion,
      canal: n.canal ?? extra?.canal,
      cuerpo: n.cuerpo ?? extra?.cuerpo,
      autor,
      payload: { webhook: crudo, mensaje: extra?.mensajeCrudo ?? null, tags },
      nota: [nota, extra?.esNoCliente ? 'NO CLIENTE (proveedor/mayorista)' : null, ...(extra?.nota ?? []), notaTurno]
        .filter(Boolean)
        .join(' · '),
    })
  })

  return Response.json({ ok: true })
}

/** Sonda de vida para comprobar que la ruta está desplegada. */
export async function GET(req: NextRequest) {
  if (!secretoValido(req)) return Response.json({ ok: false }, { status: 401 })
  return Response.json({ ok: true, fase: 1, modo: 'solo escucha' })
}
