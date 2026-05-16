import "server-only";
import { getServerSupabase } from "./supabase";

const BUCKET = "body-photos";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Storage helpers para body-photos.
 *
 * Política:
 * - Bucket privado. Sin acceso anónimo.
 * - Acceso de lectura para análisis: descargamos el blob server-side y
 *   lo pasamos a Claude Vision como base64. NUNCA generamos URLs públicas
 *   ni signed URLs que viajen al cliente — el cliente solo ve la imagen
 *   vía signed URL TTL de 5 min que se renueva por request.
 * - Path pattern: `{profile_slug}/{YYYY-MM-DD}/{timestamp}-{rand}.{ext}`.
 *   El primer nivel hace fácil "borrar todas las fotos de Andy" si pidiera
 *   ejercer derecho al olvido (GDPR).
 */

export async function ensureBodyPhotosBucket(): Promise<void> {
  const sb = getServerSupabase();
  const { data: buckets, error } = await sb.storage.listBuckets();
  if (error) {
    throw new Error(`No pude listar buckets: ${error.message}`);
  }
  if (buckets?.some((b) => b.id === BUCKET)) return;

  const { error: createErr } = await sb.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_MIME),
  });
  if (createErr) throw new Error(`No pude crear bucket: ${createErr.message}`);
}

export type UploadResult =
  | { ok: true; path: string; size: number }
  | { ok: false; error: string };

export async function uploadBodyPhoto(args: {
  profile_slug: string;
  taken_on: string;                          // YYYY-MM-DD
  file: { name: string; type: string; data: ArrayBuffer };
}): Promise<UploadResult> {
  if (!ALLOWED_MIME.has(args.file.type)) {
    return { ok: false, error: "Tipo inválido (jpg/png/webp)" };
  }
  if (args.file.data.byteLength > MAX_BYTES) {
    return { ok: false, error: "Archivo > 4MB" };
  }
  if (args.file.data.byteLength === 0) {
    return { ok: false, error: "Archivo vacío" };
  }

  await ensureBodyPhotosBucket();

  const ext = mimeToExt(args.file.type);
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${args.profile_slug}/${args.taken_on}/${stamp}-${rand}.${ext}`;

  const sb = getServerSupabase();
  const { error } = await sb.storage.from(BUCKET).upload(path, args.file.data, {
    contentType: args.file.type,
    cacheControl: "private, max-age=0",
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, path, size: args.file.data.byteLength };
}

/** Descarga el blob server-side. Devuelve Buffer para análisis o re-export. */
export async function downloadBodyPhoto(storage_path: string): Promise<{
  buffer: ArrayBuffer;
  mime: string;
} | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb.storage.from(BUCKET).download(storage_path);
  if (error || !data) return null;
  const buffer = await data.arrayBuffer();
  return { buffer, mime: data.type };
}

/** Signed URL para mostrar la imagen en la UI. TTL corto. */
export async function getBodyPhotoSignedUrl(
  storage_path: string,
  expires_seconds = 300,
): Promise<string | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(storage_path, expires_seconds);
  if (error || !data) return null;
  return data.signedUrl;
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
