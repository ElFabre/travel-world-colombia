-- ============================================================
-- Travel World Colombia — Endurecimiento RLS (auditoría 2026-08-03)
-- Migración 010: "autenticado" ya NO significa "administrador"
-- ============================================================
-- PROBLEMA QUE CORRIGE
-- Las políticas de escritura usaban `auth.role() = 'authenticated'`. Como la
-- anon key es pública por diseño, cualquier persona podía registrarse contra
-- la API de auth y obtener un JWT válido con rol `authenticated`, y con él
-- escribir directo contra PostgREST — saltándose el panel, los guards de rol
-- y la bitácora. Además podía LEER la tabla `leads` (datos personales).
--
-- Ahora la condición es pertenecer a `admin_allowlist`.
--
-- NOTA IMPORTANTE: el panel opera con SUPABASE_SERVICE_ROLE_KEY, que omite RLS
-- por completo. Por eso los superadmins de ADMIN_EMAILS (env) siguen entrando
-- aunque no tengan fila en la tabla. Estas políticas gobiernan el acceso
-- DIRECTO a la API con un JWT de usuario, que es la puerta que se cierra.

-- ── Helper: ¿el JWT pertenece a un correo aprobado? ──
-- SECURITY INVOKER a propósito: la política `allowlist_self_read` ya permite a
-- cada usuario leer su propia fila, que es exactamente lo que consulta esta
-- función, así que no hace falta elevar privilegios (con DEFINER el linter la
-- marca como invocable vía /rest/v1/rpc). El search_path fijo resuelve además
-- el aviso "function_search_path_mutable".
create or replace function public.es_admin_aprobado()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_allowlist a
    where lower(a.email) = lower((select auth.jwt() ->> 'email'))
  );
$$;

revoke all on function public.es_admin_aprobado() from public;
grant execute on function public.es_admin_aprobado() to authenticated, anon;

-- ── destinos ──
-- Una sola política de SELECT (público ve activos, admin ve todo): evita el
-- aviso "multiple_permissive_policies" y ahorra una evaluación por query.
drop policy if exists "destinos_public_read" on destinos;
drop policy if exists "destinos_admin_all"  on destinos;

create policy "destinos_read" on destinos
  for select using (activo = true or (select public.es_admin_aprobado()));

create policy "destinos_admin_insert" on destinos
  for insert to authenticated with check ((select public.es_admin_aprobado()));

create policy "destinos_admin_update" on destinos
  for update to authenticated
  using ((select public.es_admin_aprobado()))
  with check ((select public.es_admin_aprobado()));

create policy "destinos_admin_delete" on destinos
  for delete to authenticated using ((select public.es_admin_aprobado()));

-- ── resenas ──
drop policy if exists "resenas_public_read" on resenas;
drop policy if exists "resenas_admin_all"  on resenas;

create policy "resenas_read" on resenas
  for select using (activa = true or (select public.es_admin_aprobado()));

create policy "resenas_admin_insert" on resenas
  for insert to authenticated with check ((select public.es_admin_aprobado()));

create policy "resenas_admin_update" on resenas
  for update to authenticated
  using ((select public.es_admin_aprobado()))
  with check ((select public.es_admin_aprobado()));

create policy "resenas_admin_delete" on resenas
  for delete to authenticated using ((select public.es_admin_aprobado()));

-- ── faqs ──
drop policy if exists "faqs_public_read" on faqs;
drop policy if exists "faqs_admin_all"  on faqs;

create policy "faqs_read" on faqs
  for select using (activa = true or (select public.es_admin_aprobado()));

create policy "faqs_admin_insert" on faqs
  for insert to authenticated with check ((select public.es_admin_aprobado()));

create policy "faqs_admin_update" on faqs
  for update to authenticated
  using ((select public.es_admin_aprobado()))
  with check ((select public.es_admin_aprobado()));

create policy "faqs_admin_delete" on faqs
  for delete to authenticated using ((select public.es_admin_aprobado()));

-- ── leads: cerrada por completo al cliente ──
-- Ningún archivo de la app lee ni escribe esta tabla (los leads viven en GHL).
-- Sin políticas de cliente, la PII queda accesible solo vía service-role.
drop policy if exists "leads_public_insert" on leads;
drop policy if exists "leads_admin_read"   on leads;
drop policy if exists "leads_admin_update" on leads;

-- ── audit_log: lectura solo para aprobados ──
drop policy if exists "audit_admin_read" on audit_log;
create policy "audit_admin_read" on audit_log
  for select to authenticated using ((select public.es_admin_aprobado()));

-- ── security_logs: cerrada al cliente ──
-- Ningún archivo de la app escribe ni lee esta tabla (quedó del esquema
-- inicial). Igual que leads: sin políticas de cliente, solo service-role.
drop policy if exists "security_logs_insert" on security_logs;

drop policy if exists "security_logs_admin_read" on security_logs;
create policy "security_logs_admin_read" on security_logs
  for select to authenticated using ((select public.es_admin_aprobado()));

-- ── Storage: bucket 'destinos' ──
-- El bucket sigue siendo público para LEER objetos por su URL (así funcionan
-- las fotos del sitio), pero se cierra el listado del bucket y la escritura.
drop policy if exists "destinos_storage_read"   on storage.objects;
drop policy if exists "destinos_storage_insert" on storage.objects;
drop policy if exists "destinos_storage_update" on storage.objects;
drop policy if exists "destinos_storage_delete" on storage.objects;

-- Listar el contenido del bucket: solo aprobados (resuelve el aviso
-- "public_bucket_allows_listing"). Las URLs públicas NO dependen de esto.
create policy "destinos_storage_list" on storage.objects
  for select to authenticated
  using (bucket_id = 'destinos' and (select public.es_admin_aprobado()));

create policy "destinos_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'destinos' and (select public.es_admin_aprobado()));

create policy "destinos_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'destinos' and (select public.es_admin_aprobado()));

create policy "destinos_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'destinos' and (select public.es_admin_aprobado()));

-- ── admin_allowlist: rendimiento de la política existente ──
-- Misma regla (cada quien lee su fila), envuelta en (select ...) para que no
-- se re-evalúe por fila — aviso "auth_rls_initplan".
drop policy if exists "allowlist_self_read" on admin_allowlist;
create policy "allowlist_self_read" on admin_allowlist
  for select using (lower(email) = lower((select auth.jwt() ->> 'email')));

-- ── Higiene: search_path fijo en el trigger de updated_at ──
alter function public.set_updated_at() set search_path = public;
