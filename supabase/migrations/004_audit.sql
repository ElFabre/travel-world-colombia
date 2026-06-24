-- ============================================================
-- Travel World Colombia — Registro de actividad (audit log)
-- Migración 004: bitácora de mutaciones del panel admin
-- ============================================================

create table if not exists audit_log (
  id             uuid default gen_random_uuid() primary key,
  user_email     text not null,
  accion         text not null,       -- 'crear' | 'actualizar' | 'eliminar' | 'activar' | 'ocultar' | 'destacar' | 'quitar-destacado'
  destino_slug   text,
  destino_nombre text,
  detalle        jsonb,
  created_at     timestamptz default now()
);

create index if not exists idx_audit_created on audit_log (created_at desc);

alter table audit_log enable row level security;

-- Lectura: solo admin autenticado.
-- Escritura: vía service-role (createAdminClient), que omite RLS por diseño.
drop policy if exists "audit_admin_read" on audit_log;
create policy "audit_admin_read" on audit_log
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- NOTA: las inserciones las hace el servidor con
-- SUPABASE_SERVICE_ROLE_KEY (omite RLS). No hay política de
-- insert pública a propósito: nadie debe escribir la bitácora
-- desde el cliente.
-- ============================================================
