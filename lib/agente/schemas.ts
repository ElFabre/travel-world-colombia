import { z } from 'zod'

/**
 * Payload del webhook de GHL.
 *
 * A propósito es PERMISIVO (`passthrough`, casi todo opcional): en la Fase 1 el
 * objetivo es justamente descubrir la forma real del evento con tráfico de
 * producción. Rechazar por forma inesperada nos dejaría sin la información que
 * venimos a recolectar. El payload crudo se guarda completo en `agente_eventos`.
 */
export const eventoGhlSchema = z
  .object({
    type: z.string().optional(),
    locationId: z.string().optional(),

    // Identificadores (GHL varía entre camelCase y snake_case según el evento).
    conversationId: z.string().optional(),
    conversation_id: z.string().optional(),
    contactId: z.string().optional(),
    contact_id: z.string().optional(),
    messageId: z.string().optional(),
    message_id: z.string().optional(),
    id: z.string().optional(),

    // Contenido.
    body: z.string().optional(),
    message: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    direction: z.string().optional(),
    messageType: z.string().optional(),
    type_: z.string().optional(),

    // Autoría.
    userId: z.string().optional(),
    user_id: z.string().optional(),
  })
  .passthrough()

export type EventoGhl = z.infer<typeof eventoGhlSchema>

/** Normaliza los alias de GHL a un solo shape. */
export function normalizar(e: EventoGhl) {
  const mensaje = typeof e.message === 'object' && e.message !== null ? (e.message as Record<string, unknown>) : null
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined)

  return {
    tipo: e.type ?? str(mensaje?.type),
    conversationId: e.conversationId ?? e.conversation_id ?? str(mensaje?.conversationId),
    contactId: e.contactId ?? e.contact_id ?? str(mensaje?.contactId),
    messageId: e.messageId ?? e.message_id ?? str(mensaje?.id) ?? e.id,
    direccion: e.direction ?? str(mensaje?.direction),
    canal: e.messageType ?? str(mensaje?.messageType),
    cuerpo: e.body ?? (typeof e.message === 'string' ? e.message : str(mensaje?.body)),
    userId: e.userId ?? e.user_id ?? str(mensaje?.userId),
  }
}
