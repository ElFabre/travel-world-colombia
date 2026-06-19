-- ============================================================
-- Travel World Colombia — Storage
-- Migración 003: bucket de imágenes de destinos (panel admin)
-- ============================================================

-- Bucket público para las fotos subidas desde el panel.
insert into storage.buckets (id, name, public)
values ('destinos', 'destinos', true)
on conflict (id) do update set public = true;

-- ── Políticas del bucket ──
-- Lectura pública (las URLs públicas de las imágenes funcionan para todos).
drop policy if exists "destinos_storage_read" on storage.objects;
create policy "destinos_storage_read" on storage.objects
  for select using (bucket_id = 'destinos');

-- Escritura/edición/borrado solo para usuarios autenticados (admins).
-- Nota: el panel sube con service-role (omite RLS); estas políticas son
-- defensa en profundidad y habilitan el uso con cliente autenticado.
drop policy if exists "destinos_storage_insert" on storage.objects;
create policy "destinos_storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'destinos');

drop policy if exists "destinos_storage_update" on storage.objects;
create policy "destinos_storage_update" on storage.objects
  for update to authenticated using (bucket_id = 'destinos');

drop policy if exists "destinos_storage_delete" on storage.objects;
create policy "destinos_storage_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'destinos');
