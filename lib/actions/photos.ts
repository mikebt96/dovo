"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { requireSlug, requirePinSession } from "@/lib/auth/session";
import { uploadBodyPhoto } from "@/lib/storage";
import { analyzeBodyPhoto } from "@/lib/ai/body-analysis";

/**
 * Upload de body photo:
 *   1. Doble gate: requireSlug + requirePinSession (datos sensibles).
 *   2. Sube el archivo a Storage bucket privado.
 *   3. Inserta fila en body_photos con storage_path.
 *   4. Dispara analyzeBodyPhoto fire-and-forget — el upload responde
 *      inmediatamente, el análisis se persiste async. La UI puede
 *      hacer poll o el user puede refrescar la página.
 */

const Input = z.object({
  profile: z.enum(["mike", "andy"]),
  taken_on: z.string().date(),
});

type Result =
  | { ok: true; photo_id: number; path: string }
  | { ok: false; error: string };

export async function uploadPhoto(formData: FormData): Promise<Result> {
  await requireSlug();
  await requirePinSession();

  const parsed = Input.safeParse({
    profile: formData.get("profile"),
    taken_on: formData.get("taken_on"),
  });
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  const data = parsed.data;

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return { ok: false, error: "Archivo no recibido" };
  }
  const arrayBuffer = await file.arrayBuffer();

  const profile_id = await slugToUuid(data.profile);
  if (!profile_id) return { ok: false, error: "Perfil no encontrado" };

  const uploaded = await uploadBodyPhoto({
    profile_slug: data.profile,
    taken_on: data.taken_on,
    file: { name: file.name, type: file.type, data: arrayBuffer },
  });
  if (!uploaded.ok) return uploaded;

  const sb = getServerSupabase();
  const { data: row, error } = await sb
    .from("body_photos")
    .insert({
      profile_id,
      taken_on: data.taken_on,
      storage_path: uploaded.path,
      ai_analysis: null,
    })
    .select("id")
    .single();
  if (error || !row) {
    // Limpiar el archivo huérfano del bucket
    await sb.storage.from("body-photos").remove([uploaded.path]).catch(() => {});
    return { ok: false, error: error?.message ?? "DB insert falló" };
  }

  const photo_id = row.id as number;

  // Dispatch async — el cliente no espera. Si falla, body_photos.ai_analysis
  // queda null y el user puede pedir reanálisis.
  void analyzeBodyPhoto(photo_id).catch((err) => {
    console.warn(`[uploadPhoto] analyze fire-and-forget failed:`, err);
  });

  revalidatePath(`/${data.profile}/foto`);
  return { ok: true, photo_id, path: uploaded.path };
}

/** Re-disparar análisis manual desde la UI. Útil si el async original falló. */
export async function reanalyzePhoto(photo_id: number): Promise<Result> {
  await requireSlug();
  await requirePinSession();

  const res = await analyzeBodyPhoto(photo_id);
  if (!res.ok) {
    return { ok: false, error: res.error ?? "Análisis falló" };
  }

  // No tenemos profile slug aquí — invalidamos ambos por simplicidad.
  revalidatePath("/mike/foto");
  revalidatePath("/andy/foto");

  return { ok: true, photo_id, path: "" };
}

export async function deletePhoto(args: {
  profile: "mike" | "andy";
  photo_id: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSlug();
  await requirePinSession();

  const profile_id = await slugToUuid(args.profile);
  if (!profile_id) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();
  const { data: row, error: readErr } = await sb
    .from("body_photos")
    .select("storage_path")
    .eq("id", args.photo_id)
    .eq("profile_id", profile_id)
    .single();
  if (readErr || !row) return { ok: false, error: "Foto no encontrada" };

  await sb.storage
    .from("body-photos")
    .remove([row.storage_path as string])
    .catch(() => {});
  const { error: delErr } = await sb
    .from("body_photos")
    .delete()
    .eq("id", args.photo_id)
    .eq("profile_id", profile_id);
  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath(`/${args.profile}/foto`);
  return { ok: true };
}
