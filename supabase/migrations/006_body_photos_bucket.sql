-- =============================================================
-- Migration 006: bucket de Supabase Storage para body_photos
--
-- Crea el bucket `body-photos` como PRIVADO. Sin RLS porque el server
-- siempre lee/escribe con service_role (consistente con el resto del
-- esquema). El bucket NO debe ser público — fotos corporales son datos
-- sensibles que requieren paso adicional de PIN (middleware ya lo cubre
-- para rutas /foto/*).
--
-- El helper `lib/storage.ts > ensureBodyPhotosBucket()` también crea el
-- bucket idempotente al primer upload, así que esta migration es
-- redundante con ese flow — la dejo por trazabilidad de schema.
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'body-photos',
  'body-photos',
  false,                                    -- privado
  4 * 1024 * 1024,                          -- 4 MB max por archivo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
