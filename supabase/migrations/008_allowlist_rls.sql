-- ============================================================
-- Travel World Colombia — Endurecimiento RLS de la allowlist
-- Migración 008: lectura de admin_allowlist solo de la propia fila
-- ============================================================
-- Antes: la política "allowlist_admin_read" permitía a CUALQUIER usuario
-- autenticado leer toda la tabla (todos los correos y roles de admins).
-- Como el auto-registro aprueba como editor, eso filtraba la lista completa.
--
-- Ahora: cada usuario solo puede leer su propia fila. El panel
-- (dashboard / usuarios) usa SUPABASE_SERVICE_ROLE_KEY y omite RLS, así que
-- sigue viendo todo; el proxy solo consulta la fila del propio usuario.

drop policy if exists "allowlist_admin_read" on admin_allowlist;

create policy "allowlist_self_read" on admin_allowlist
  for select using (lower(email) = lower(auth.jwt() ->> 'email'));
