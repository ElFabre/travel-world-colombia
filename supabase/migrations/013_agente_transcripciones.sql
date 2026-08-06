-- ============================================================
-- Travel World Colombia — Agente Sol
-- Migración 013: caché de transcripciones de notas de voz
-- ============================================================
-- Claude NO acepta audio como input (solo texto/imágenes/PDF), así que las
-- notas de voz de WhatsApp se transcriben con un servicio aparte (OpenAI).
-- La transcripción se cachea por `message_id` de GHL para no re-transcribir el
-- mismo audio en cada turno (el historial de la conversación lo trae otra vez).
--
-- Sin políticas RLS a propósito: igual que `agente_eventos`, solo se toca con
-- service-role desde el servidor.

create table if not exists agente_transcripciones (
  message_id text primary key,   -- id del mensaje de GHL (la nota de voz)
  url        text not null,      -- URL del audio transcrito (para trazabilidad)
  texto      text not null,      -- transcripción
  creado_en  timestamptz not null default now()
);

alter table agente_transcripciones enable row level security;
