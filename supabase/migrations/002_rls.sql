-- ============================================================
-- Travel World Colombia — Row Level Security
-- Migración 002: Políticas RLS
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table destinos      enable row level security;
alter table leads         enable row level security;
alter table resenas       enable row level security;
alter table security_logs enable row level security;

-- ── destinos: lectura pública (solo activos), escritura solo admin ──
drop policy if exists "destinos_public_read" on destinos;
create policy "destinos_public_read" on destinos
  for select using (activo = true);

drop policy if exists "destinos_admin_all" on destinos;
create policy "destinos_admin_all" on destinos
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── leads: insert público (formularios), lectura solo admin ──
drop policy if exists "leads_public_insert" on leads;
create policy "leads_public_insert" on leads
  for insert with check (true);

drop policy if exists "leads_admin_read" on leads;
create policy "leads_admin_read" on leads
  for select using (auth.role() = 'authenticated');

drop policy if exists "leads_admin_update" on leads;
create policy "leads_admin_update" on leads
  for update using (auth.role() = 'authenticated');

-- ── resenas: lectura pública (solo activas), escritura solo admin ──
drop policy if exists "resenas_public_read" on resenas;
create policy "resenas_public_read" on resenas
  for select using (activa = true);

drop policy if exists "resenas_admin_all" on resenas;
create policy "resenas_admin_all" on resenas
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── security_logs: insert público (logging), lectura solo admin ──
drop policy if exists "security_logs_insert" on security_logs;
create policy "security_logs_insert" on security_logs
  for insert with check (true);

drop policy if exists "security_logs_admin_read" on security_logs;
create policy "security_logs_admin_read" on security_logs
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- NOTA: Las escrituras del servidor (API routes con
-- SUPABASE_SERVICE_ROLE_KEY) omiten RLS por diseño.
-- El insert de leads usa anon key + política pública.
-- Storage: configurar políticas del bucket 'destinos' en
-- Dashboard → Storage → Policies (lectura pública, subida admin).
-- ============================================================
