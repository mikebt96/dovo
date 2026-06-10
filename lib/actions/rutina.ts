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

  // F9 · La rutina cambió ⇒ el plan prescrito ya no aplica: regenera el SAMPLE con las
  // disciplinas nuevas (best-effort: si falta perfil físico, el plan se genera después
  // en el page load de /rutina — nunca bloquea el guardado de la rutina).
  await regenerarPlanSample(miembro_id, actividades);

  revalidatePath("/");
  return { ok: true, data: undefined };
}

async function regenerarPlanSample(
  miembroId: string,
  actividades: { actividad_id: string; frecuencia_semanal: number; duracion_min: number }[],
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: fisico } = await supabase
      .schema("core")
      .from("user_perfil_fisico")
      .select("peso_kg, altura_cm, edad, genero, nivel_actividad, objetivo, bmr_calculado")
      .eq("user_id", user.id)
      .maybeSingle<import("@/lib/workout/types").PerfilFisico>();
    if (!fisico) return;

    const { data: acts } = await supabase
      .schema("core")
      .from("actividades")
      .select("id, slug")
      .in("id", actividades.map((a) => a.actividad_id));
    const slugDe = new Map((acts ?? []).map((a) => [a.id as string, a.slug as string]));
    const items = actividades
      .map((a) => ({
        slug: slugDe.get(a.actividad_id) ?? "",
        frecuencia_semanal: a.frecuencia_semanal,
        duracion_min: a.duracion_min,
      }))
      .filter((i) => i.slug !== "");
    if (items.length === 0) return;

    // Preserva las prefs declaradas (equipo/lesiones) — el sample también las respeta.
    const { data: planRow } = await supabase
      .schema("core")
      .from("workout_plans")
      .select("prefs")
      .eq("miembro_id", miembroId)
      .maybeSingle<{ prefs: import("@/lib/workout/types").WorkoutPrefs }>();
    const { generateSampleWorkout } = await import("@/lib/workout/generate");
    const generated = generateSampleWorkout(fisico, items, planRow?.prefs ?? {});
    const { error } = await supabase
      .schema("core")
      .from("workout_plans")
      .upsert(
        {
          miembro_id: miembroId,
          source: generated.source,
          plan: generated.plan,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "miembro_id" },
      );
    if (error) console.error("[rutina] regen plan:", error.message);
  } catch (err) {
    console.error("[rutina] regen plan:", err instanceof Error ? err.message : err);
  }
}
