-- ============================================================
-- Travel World Colombia — Estado de solicitudes (leads)
-- Migración 006: marcar leads como atendidos + notas internas
-- ============================================================

alter table leads add column if not exists atendido boolean default false;
alter table leads add column if not exists notas    text;

create index if not exists idx_leads_atendido on leads (atendido);

-- ============================================================
-- NOTA: la política leads_admin_update (migración 002) ya permite
-- a un admin autenticado actualizar leads. Las escrituras del panel
-- usan service-role y omiten RLS de todos modos.
-- ============================================================
