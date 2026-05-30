"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rutinaSchema, type RutinaInput } from "@/lib/schemas/rutina";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function guardarRutina(input: RutinaInput): Promise<Result> {
  const parsed = rutinaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { miembro_id, nombre, actividades } = parsed.data;

  // Reemplaza la rutina default del miembro (RLS owns_miembro garantiza pertenencia).
  const { error: delErr } = await supabase
    .schema("core")
    .from("user_rutinas")
    .delete()
    .eq("miembro_id", miembro_id)
    .eq("is_default", true);
  if (delErr) return { ok: false, error: delErr.message };

  const { error } = await supabase
    .schema("core")
    .from("user_rutinas")
    .insert({ miembro_id, nombre, is_default: true, is_travel: false, actividades });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true, data: undefined };
}
