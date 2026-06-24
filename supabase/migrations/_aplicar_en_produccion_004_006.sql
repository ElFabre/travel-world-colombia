-- ============================================================
-- Travel World Colombia — Aplicar en PRODUCCIÓN (Supabase)
-- Combina migraciones 004 + 005 + 006. Es idempotente: se puede
-- ejecutar varias veces sin romper nada.
--
-- Cómo usar: Supabase Dashboard → SQL Editor → New query →
-- pega todo esto → Run.
-- ============================================================

-- ---------- 004: audit log ----------
create table if not exists audit_log (
  id             uuid default gen_random_uuid() primary key,
  user_email     text not null,
  accion         text not null,
  destino_slug   text,
  destino_nombre text,
  detalle        jsonb,
  created_at     timestamptz default now()
);

create index if not exists idx_audit_created on audit_log (created_at desc);

alter table audit_log enable row level security;

drop policy if exists "audit_admin_read" on audit_log;
create policy "audit_admin_read" on audit_log
  for select using (auth.role() = 'authenticated');

-- ---------- 005: allowlist de usuarios ----------
create table if not exists admin_allowlist (
  email        text primary key,
  rol          text not null default 'editor',
  aprobado_por text,
  created_at   timestamptz default now()
);

alter table admin_allowlist add column if not exists rol text not null default 'editor';

alter table admin_allowlist enable row level security;

drop policy if exists "allowlist_admin_read" on admin_allowlist;
create policy "allowlist_admin_read" on admin_allowlist
  for select using (auth.role() = 'authenticated');

-- ---------- 006: estado de leads ----------
alter table leads add column if not exists atendido boolean default false;
alter table leads add column if not exists notas    text;

create index if not exists idx_leads_atendido on leads (atendido);
