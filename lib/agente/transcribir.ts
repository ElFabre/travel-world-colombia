import { createAdminClient } from '@/lib/supabase/admin'
import type { MensajeGhl } from '@/lib/agente/ghl'

/**
 * Notas de voz: Claude no acepta audio como input (solo texto, imágenes y PDF),
 * así que las transcribimos con OpenAI antes de pasárselas al modelo.
 *
 * En WhatsApp el audio llega como un mensaje con `body: ">AUDIO<"` y la URL del
 * archivo en `attachments`. Aquí se detecta, se transcribe (con caché por
 * message_id para no pagar dos veces el mismo audio) y se reemplaza el cuerpo
 * del mensaje por la transcripción, de modo que el resto del pipeline lo trata
 * como texto normal.
 *
 * Nada aquí puede tumbar el turno: si falta la API key o la transcripción falla,
 * se deja una marca legible y Sol sigue (pedirá que lo escriban, como hoy).
 */

const EXT_AUDIO = /\.(mp3|ogg|oga|m4a|wav|amr|aac|opus)(\?|$)/i
const PLACEHOLDER_GHL = '>AUDIO<'
const MODELO = process.env.OPENAI_TRANSCRIBE_MODEL ?? 'gpt-4o-transcribe'

/** URL del audio si el mensaje es una nota de voz; null si no lo es. */
function urlDeAudio(m: MensajeGhl): string | null {
  const adjuntoAudio = m.attachments?.find(a => EXT_AUDIO.test(a))
  if (adjuntoAudio) return adjuntoAudio
  // Algunos proveedores no marcan extensión pero sí mandan el placeholder.
  if ((m.body ?? '').trim() === PLACEHOLDER_GHL && m.attachments?.length) {
    return m.attachments[0]
  }
  return null
}

/**
 * Reemplaza el cuerpo de las notas de voz por su transcripción. Los mensajes
 * que no son audio se devuelven tal cual.
 */
export async function resolverAudios(mensajes: MensajeGhl[]): Promise<MensajeGhl[]> {
  const conAudio = mensajes.filter(m => m.id && urlDeAudio(m))
  if (conAudio.length === 0) return mensajes

  const cache = await leerCache(conAudio.map(m => m.id))

  const transcripciones = new Map<string, string>()
  for (const m of conAudio) {
    const cacheado = cache.get(m.id)
    if (cacheado !== undefined) {
      transcripciones.set(m.id, cacheado)
      continue
    }
    const url = urlDeAudio(m)!
    const texto = await transcribirAudio(url)
    if (texto) {
      transcripciones.set(m.id, texto)
      await guardarCache(m.id, url, texto)
    }
  }

  return mensajes.map(m => {
    const texto = m.id ? transcripciones.get(m.id) : undefined
    if (texto === undefined) return m
    return { ...m, body: `(Nota de voz) ${texto}` }
  })
}

/** Descarga el audio y lo manda a OpenAI. Devuelve null ante cualquier fallo. */
async function transcribirAudio(url: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('transcribirAudio: falta OPENAI_API_KEY')
    return null
  }

  try {
    const audio = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!audio.ok) throw new Error(`descarga del audio: ${audio.status}`)
    const blob = await audio.blob()

    const form = new FormData()
    form.append('file', blob, nombreArchivo(url))
    form.append('model', MODELO)

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const detalle = await res.text().catch(() => '')
      throw new Error(`OpenAI ${res.status}: ${detalle.slice(0, 200)}`)
    }
    const data = (await res.json()) as { text?: string }
    return data.text?.trim() || null
  } catch (err) {
    console.error('transcribirAudio falló:', (err as Error).message)
    return null
  }
}

/** OpenAI exige una extensión reconocible en el nombre del archivo. */
function nombreArchivo(url: string): string {
  const m = url.match(EXT_AUDIO)
  const ext = m ? m[1].toLowerCase() : 'mp3'
  return `audio.${ext}`
}

async function leerCache(ids: string[]): Promise<Map<string, string>> {
  const cache = new Map<string, string>()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agente_transcripciones')
    .select('message_id, texto')
    .in('message_id', ids)
  if (error) {
    console.error('leerCache transcripciones:', error.message)
    return cache
  }
  for (const fila of data ?? []) cache.set(fila.message_id, fila.texto)
  return cache
}

async function guardarCache(messageId: string, url: string, texto: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('agente_transcripciones')
    .upsert({ message_id: messageId, url, texto })
  if (error) console.error('guardarCache transcripciones:', error.message)
}
