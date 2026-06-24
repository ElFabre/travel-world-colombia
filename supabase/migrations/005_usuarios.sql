-- ============================================================
-- Travel World Colombia — Gestión de usuarios del panel
-- Migración 005: allowlist editable desde el panel
-- ============================================================

-- Correos aprobados para acceder al panel. Se gestiona desde
-- /admin/usuarios (rol / Revocar). Los superadmins de ADMIN_EMAILS
-- (env) siempre tienen acceso como admin aunque no estén aquí.
-- rol: 'admin' (todo) | 'editor' (todo menos eliminar) | 'lector' (solo ver).
create table if not exists admin_allowlist (
  email        text primary key,
  rol          text not null default 'editor',
  aprobado_por text,                       -- correo de quien lo aprobó, o 'auto'
  created_at   timestamptz default now()
);

-- Si la tabla ya existía sin la columna rol, agregarla.
alter table admin_allowlist add column if not exists rol text not null default 'editor';

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
