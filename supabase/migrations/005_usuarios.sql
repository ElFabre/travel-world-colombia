-- ============================================================
-- Travel World Colombia — Gestión de usuarios del panel
-- Migración 005: allowlist editable desde el panel
-- ============================================================

-- Correos aprobados para acceder al panel. Se gestiona desde
-- /admin/usuarios (Aprobar / Revocar). Los superadmins de
-- ADMIN_EMAILS (env) siempre tienen acceso aunque no estén aquí.
create table if not exists admin_allowlist (
  email        text primary key,
  aprobado_por text,                       -- correo del admin que aprobó
  created_at   timestamptz default now()
);

alter table admin_allowlist enable row level security;

-- Lectura: solo admin autenticado. Escritura vía service-role (omite RLS).
drop policy if exists "allowlist_admin_read" on admin_allowlist;
create policy "allowlist_admin_read" on admin_allowlist
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- NOTA: las altas/bajas las hace el servidor con
-- SUPABASE_SERVICE_ROLE_KEY (omite RLS). Sin política de insert
-- pública: nadie se auto-aprueba desde el cliente.
-- ============================================================
