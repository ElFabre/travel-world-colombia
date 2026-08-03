-- ============================================================
-- Travel World Colombia — Agente Sol
-- Migración 011: bitácora cruda de eventos del webhook de GHL
-- ============================================================
-- Fase 1 del agente: la ruta /api/agente/webhook NO responde a nadie todavía,
-- solo escucha y registra. Con tráfico real validamos:
--   · la forma exacta del payload que manda GHL (puede diferir del API REST),
--   · que sepamos distinguir quién escribió (cliente / Sol / bot actual /
--     asesora desde la UI / asesora desde el celular),
--   · el volumen y los canales reales.
--
-- Sin políticas RLS a propósito: igual que `leads`, esta tabla solo se toca con
-- service-role desde el servidor.

create table if not exists agente_eventos (
  id              uuid primary key default gen_random_uuid(),
  recibido_en     timestamptz not null default now(),

  tipo            text,          -- InboundMessage, OutboundMessage, ContactCreate…
  conversation_id text,
  contact_id      text,
  message_id      text,          -- para el anti-bucle: ¿este mensaje lo enviamos nosotros?
  direccion       text,          -- inbound | outbound
  autor           text,          -- cliente | sol | bot_actual | humano | desconocido
  canal           text,          -- whatsapp/sms, instagram, facebook, widget…
  cuerpo          text,          -- texto del mensaje (recortado), para leer la bitácora a ojo

  payload         jsonb not null, -- evento crudo tal cual llegó
  nota            text            -- por qué se clasificó así, o motivo de descarte
);

create index if not exists idx_agente_eventos_fecha  on agente_eventos (recibido_en desc);
create index if not exists idx_agente_eventos_conv   on agente_eventos (conversation_id);
create index if not exists idx_agente_eventos_msg    on agente_eventos (message_id);

alter table agente_eventos enable row level security;

-- ============================================================
-- Registro de mensajes que enviamos nosotros. Es la primera capa del
-- anti-bucle: si un outbound que llega por webhook tiene un message_id que
-- está aquí, es de Sol y se ignora.
-- ============================================================
create table if not exists agente_mensajes_enviados (
  message_id      text primary key,
  conversation_id text,
  contact_id      text,
  enviado_en      timestamptz not null default now()
);

create index if not exists idx_agente_enviados_fecha on agente_mensajes_enviados (enviado_en desc);

alter table agente_mensajes_enviados enable row level security;
