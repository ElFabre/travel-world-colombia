-- ============================================================
-- Travel World Colombia — Documentos adjuntos del viaje
-- Migración 018: columna `archivos` en destinos + bucket `documentos`
-- ============================================================
-- Cada elemento del array es un documento descargable del viaje:
--   [{titulo, url, tipo, bytes}]
--   titulo → nombre visible, ej. "Itinerario detallado"
--   url    → URL pública en el bucket `documentos`
--   tipo   → 'pdf' | 'word' (decide si se ofrece "Ver" además de "Descargar")
--   bytes  → peso del archivo (para mostrar "2.3 MB")
--
-- IMPORTANTE: aplicar en producción ANTES de desplegar el panel con el
-- editor de documentos (si no, guardar un viaje fallará con
-- "Could not find the 'archivos' column").

alter table destinos add column if not exists archivos jsonb;

-- ── Bucket de documentos (PDF / Word) ──
-- Público (los enlaces de la página del producto funcionan para todos),
-- tope 20 MB y solo tipos PDF/Word — todo validado por Supabase al subir.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos', 'documentos', true, 20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Políticas del bucket (mismas que el bucket `destinos`, migración 003) ──
drop policy if exists "documentos_storage_read" on storage.objects;
create policy "documentos_storage_read" on storage.objects
  for select using (bucket_id = 'documentos');

drop policy if exists "documentos_storage_insert" on storage.objects;
create policy "documentos_storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos');

drop policy if exists "documentos_storage_update" on storage.objects;
create policy "documentos_storage_update" on storage.objects
  for update to authenticated using (bucket_id = 'documentos');

drop policy if exists "documentos_storage_delete" on storage.objects;
create policy "documentos_storage_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'documentos');
