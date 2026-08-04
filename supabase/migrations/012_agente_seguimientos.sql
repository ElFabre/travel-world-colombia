-- ============================================================
-- Travel World Colombia — Agente Sol
-- Migración 012: cola operativa del seguimiento dinámico (§5 del diseño)
-- ============================================================
-- Una fila por contacto: la última decisión del modelo sobreescribe la
-- anterior (upsert). Es la fuente operativa del runner de seguimientos;
-- los campos `sol_proximo_seguimiento` / `sol_intentos_seguimiento` de GHL
-- son el espejo visible para las asesoras, no la cola.
--
-- Sin políticas RLS a propósito: igual que `agente_eventos`, solo se toca
-- con service-role desde el servidor.

create table if not exists agente_seguimientos (
  contact_id      text primary key,
  conversation_id text not null,
  canal           text,          -- whatsapp | instagram | facebook | widget
  programado_para date,          -- cuándo toca volver a escribir (hora de Colombia)
  intentos        int  not null default 0,
  estado          text not null default 'pendiente', -- pendiente | dormido | cerrado
  nota            text,          -- ángulo propuesto por el modelo, o motivo del estado
  actualizado_en  timestamptz not null default now()
);

create index if not exists idx_agente_seguimientos_debidos
  on agente_seguimientos (estado, programado_para);

alter table agente_seguimientos enable row level security;
