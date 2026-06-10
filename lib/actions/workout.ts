"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEntitlement } from "@/lib/billing/tier";
import { logAppError } from "@/lib/observability/log";
import { EQUIPOS, POR_SLUG } from "@/lib/workout/catalog";
import { hoyCDMX } from "@/lib/workout/fecha";
import {
  generateSampleWorkout,
  generateWorkoutWithAi,
  isWorkoutAiLive,
} from "@/lib/workout/generate";
import { sugerirPeso } from "@/lib/workout/progresion";
import type { RutinaItem } from "@/lib/workout/sample-plans";
import type {
  ExerciseLogRow,
  PerfilFisico,
  Progresion,
  SerieLog,
  WorkoutPlanContent,
  WorkoutPlanRow,
  WorkoutPrefs,
} from "@/lib/workout/types";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type WorkoutData = {
  miembroId: string | null;
  fisico: PerfilFisico | null;
  rutina: RutinaItem[]; // disciplinas+frecuencia resueltas a slug (vacía = sin rutina aún)
  plan: WorkoutPlanRow | null;
  logsHoy: ExerciseLogRow[];
  progresion: Record<string, Progresion>; // por exercise_slug del plan
  aiLive: boolean;
  entitledAi: boolean;
};

// ── helpers ──

async function getMiembro(grupoId: string): Promise<{ id: string; userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id")
    .eq("trato_id", grupoId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  if (error) console.error("[workout] miembro:", error.message);
  return data ? { id: data.id, userId: user.id } : null;
}

async function getFisico(userId: string): Promise<PerfilFisico | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("peso_kg, altura_cm, edad, genero, nivel_actividad, objetivo, bmr_calculado")
    .eq("user_id", userId)
    .maybeSingle<PerfilFisico>();
  if (error) console.error("[workout] perfil:", error.message);
  return data ?? null;
}

/** Rutina default del miembro con actividad_id resuelto a slug. */
async function getRutinaItems(miembroId: string): Promise<RutinaItem[]> {
  const supabase = await createClient();
  const { data: rutina, error } = await supabase
    .schema("core")
    .from("user_rutinas")
    .select("actividades")
    .eq("miembro_id", miembroId)
    .eq("is_default", true)
    .maybeSingle<{ actividades: unknown }>();
  if (error) console.error("[workout] rutina:", error.message);
  const items = Array.isArray(rutina?.actividades)
    ? (rutina!.actividades as { actividad_id: string; frecuencia_semanal: number; duracion_min: number }[])
    : [];
  if (items.length === 0) return [];

  const { data: acts, error: actsErr } = await supabase
    .schema("core")
    .from("actividades")
    .select("id, slug")
    .in("id", items.map((i) => i.actividad_id));
  if (actsErr) console.error("[workout] actividades:", actsErr.message);
  const slugDe = new Map((acts ?? []).map((a) => [a.id as string, a.slug as string]));

  return items
    .map((i) => ({
      slug: slugDe.get(i.actividad_id) ?? "",
      frecuencia_semanal: Number(i.frecuencia_semanal) || 1,
      duracion_min: Number(i.duracion_min) || 45,
    }))
    .filter((i) => i.slug !== "");
}

// ── lectura principal de la página ──

export async function getWorkoutData(grupoId: string): Promise<WorkoutData> {
  const empty: WorkoutData = {
    miembroId: null,
    fisico: null,
    rutina: [],
    plan: null,
    logsHoy: [],
    progresion: {},
    aiLive: isWorkoutAiLive(),
    entitledAi: false,
  };
  const miembro = await getMiembro(grupoId);
  if (!miembro) return empty;

  const supabase = await createClient();
  const [fisico, rutina, { entitled }] = await Promise.all([
    getFisico(miembro.userId),
    getRutinaItems(miembro.id),
    getEntitlement("workout_ai"),
  ]);

  let plan: WorkoutPlanRow | null = null;
  const { data: planRow, error: planErr } = await supabase
    .schema("core")
    .from("workout_plans")
    .select("id, source, plan, prefs, generated_at")
    .eq("miembro_id", miembro.id)
    .maybeSingle<WorkoutPlanRow>();
  if (planErr) console.error("[workout] plan:", planErr.message);
  plan = planRow ?? null;

  // Sin plan pero con rutina+perfil ⇒ genera el SAMPLE al instante (nunca llama IA en
  // page load — contrato F5). Idempotente por unique(miembro_id).
  if (!plan && fisico && rutina.length > 0) {
    const generated = generateSampleWorkout(fisico, rutina);
    // ignoreDuplicates (DO NOTHING): el page load solo CREA el plan si no existe — jamás
    // pisa uno generado en paralelo (p.ej. un plan IA desde otra pestaña, review F9).
    const { data: inserted, error: insErr } = await supabase
      .schema("core")
      .from("workout_plans")
      .upsert(
        { miembro_id: miembro.id, source: generated.source, plan: generated.plan },
        { onConflict: "miembro_id", ignoreDuplicates: true },
      )
      .select("id, source, plan, prefs, generated_at")
      .maybeSingle<WorkoutPlanRow>();
    if (insErr) {
      console.error("[workout] plan upsert:", insErr.message);
      void logAppError({ origen: "workout-plan", mensaje: insErr.message, userId: miembro.userId });
    }
    if (!inserted) {
      // DO NOTHING devolvió vacío ⇒ alguien más insertó primero: re-lee la fila real.
      const { data: releido } = await supabase
        .schema("core")
        .from("workout_plans")
        .select("id, source, plan, prefs, generated_at")
        .eq("miembro_id", miembro.id)
        .maybeSingle<WorkoutPlanRow>();
      plan = releido ?? ({
        id: "local",
        source: generated.source,
        plan: generated.plan,
        prefs: {},
        generated_at: new Date().toISOString(),
      } as WorkoutPlanRow);
    } else {
      plan = inserted;
    }
  }

  // Logs de hoy + último log por ejercicio del plan (para progresión).
  const hoy = hoyCDMX();
  const { data: logsHoy, error: logsErr } = await supabase
    .schema("core")
    .from("exercise_logs")
    .select("id, fecha, exercise_slug, series")
    .eq("miembro_id", miembro.id)
    .eq("fecha", hoy)
    .order("created_at", { ascending: true });
  if (logsErr) console.error("[workout] logs hoy:", logsErr.message);

  const progresion: Record<string, Progresion> = {};
  if (plan) {
    const slugs = [
      ...new Set(plan.plan.dias.flatMap((d) => d.bloques.map((b) => b.exercise_slug))),
    ].filter((s) => POR_SLUG.get(s)?.con_peso);
    if (slugs.length > 0) {
      // Últimos 120 logs del miembro en esos slugs; el más reciente por slug manda.
      const { data: recientes, error: recErr } = await supabase
        .schema("core")
        .from("exercise_logs")
        .select("fecha, exercise_slug, series")
        .eq("miembro_id", miembro.id)
        .in("exercise_slug", slugs)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false }) // tie-break: 2 logs el mismo día
        .limit(120);
      if (recErr) console.error("[workout] progresión:", recErr.message);
      const repsDe = new Map(
        plan.plan.dias.flatMap((d) => d.bloques.map((b) => [b.exercise_slug, b.reps] as const)),
      );
      for (const row of (recientes ?? []) as Pick<ExerciseLogRow, "fecha" | "exercise_slug" | "series">[]) {
        if (progresion[row.exercise_slug]) continue; // ya tenemos el más reciente
        if (!Array.isArray(row.series)) continue; // defensa: series jsonb malformado (review F9)
        progresion[row.exercise_slug] = {
          exercise_slug: row.exercise_slug,
          ultima_fecha: row.fecha,
          ultima_series: row.series,
          sugerencia_kg: sugerirPeso(row.exercise_slug, row.series, repsDe.get(row.exercise_slug) ?? ""),
        };
      }
    }
  }

  return {
    miembroId: miembro.id,
    fisico,
    rutina,
    plan,
    logsHoy: (logsHoy ?? []) as ExerciseLogRow[],
    progresion,
    aiLive: isWorkoutAiLive(),
    entitledAi: entitled,
  };
}

// ── personalización con IA (Pro + flag + rate-limit semanal) ──

// equipo validado contra el catálogo (review F9: texto libre aquí era inyección de
// prompt acotada — el prompt lo rotula OBLIGATORIO).
const prefsSchema = z.object({
  equipo: z.array(z.enum(EQUIPOS as unknown as [string, ...string[]])).max(10).optional(),
  lesiones: z.string().max(200).optional(),
  preferencias: z.string().max(200).optional(),
});

export async function regenerateWorkoutAi(input: {
  grupoId: string;
  prefs?: WorkoutPrefs;
}): Promise<Result<{ source: "sample" | "ai" }>> {
  if (!isWorkoutAiLive()) return { ok: false, error: "coming_soon" };

  const { entitled } = await getEntitlement("workout_ai");
  if (!entitled) return { ok: false, error: "requiere plan pro" };

  const miembro = await getMiembro(input.grupoId);
  if (!miembro) return { ok: false, error: "sin sesión" };

  const parsedPrefs = prefsSchema.safeParse(input.prefs ?? {});
  const prefs: WorkoutPrefs = parsedPrefs.success ? (parsedPrefs.data as WorkoutPrefs) : {};

  const [fisico, rutina] = await Promise.all([getFisico(miembro.userId), getRutinaItems(miembro.id)]);
  if (!fisico) return { ok: false, error: "completa tu perfil físico primero" };
  if (rutina.length === 0) return { ok: false, error: "configura tus disciplinas primero" };

  const supabase = await createClient();

  // Control de costo: 1 generación IA por semana por miembro, gateado contra
  // ai_generated_at — columna que regenerarPlanSample/page-load JAMÁS tocan (el review
  // adversarial encontró que gatear contra source era evadible re-guardando la rutina).
  const { data: existing, error: exErr } = await supabase
    .schema("core")
    .from("workout_plans")
    .select("ai_generated_at")
    .eq("miembro_id", miembro.id)
    .maybeSingle<{ ai_generated_at: string | null }>();
  if (exErr) {
    console.error("[workout] límite semanal:", exErr.message);
    return { ok: false, error: "no se pudo verificar tu plan — intenta de nuevo" };
  }
  if (
    existing?.ai_generated_at &&
    Date.now() - new Date(existing.ai_generated_at).getTime() < 7 * 24 * 60 * 60 * 1000
  ) {
    return { ok: false, error: "tu plan ya es personalizado — la ia regenera cada semana" };
  }

  const generated = await generateWorkoutWithAi(fisico, rutina, prefs);

  const { error: upErr } = await supabase
    .schema("core")
    .from("workout_plans")
    .upsert(
      {
        miembro_id: miembro.id,
        source: generated.source,
        plan: generated.plan as WorkoutPlanContent,
        prefs,
        generated_at: new Date().toISOString(),
        // Solo una generación IA EXITOSA quema el slot semanal: el fallback a sample
        // (error de API) deja ai_generated_at intacto y el usuario puede reintentar.
        ...(generated.source === "ai" ? { ai_generated_at: new Date().toISOString() } : {}),
      },
      { onConflict: "miembro_id" },
    );
  if (upErr) {
    console.error("[workout] plan upsert:", upErr.message);
    void logAppError({ origen: "workout-ai", mensaje: `upsert: ${upErr.message}`, userId: miembro.userId });
    return { ok: false, error: "no se pudo guardar el plan — intenta de nuevo" };
  }

  revalidatePath(`/grupo/${input.grupoId}/rutina`);
  return { ok: true, data: { source: generated.source } };
}

// ── logging por ejercicio ──

const serieSchema = z.object({
  reps: z.number().int().min(1).max(100),
  peso_kg: z.number().min(0).max(500).nullable(),
});
const logSchema = z.object({
  grupoId: z.string().uuid(),
  exercise_slug: z.string().min(1).max(60),
  series: z.array(serieSchema).min(1).max(10),
});

export async function logExercise(input: {
  grupoId: string;
  exercise_slug: string;
  series: SerieLog[];
}): Promise<Result<ExerciseLogRow>> {
  const parsed = logSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "datos inválidos — revisa reps y peso" };
  if (!POR_SLUG.has(parsed.data.exercise_slug)) return { ok: false, error: "ejercicio desconocido" };

  const miembro = await getMiembro(parsed.data.grupoId);
  if (!miembro) return { ok: false, error: "sin sesión" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("core")
    .from("exercise_logs")
    .insert({
      miembro_id: miembro.id,
      fecha: hoyCDMX(),
      exercise_slug: parsed.data.exercise_slug,
      series: parsed.data.series,
    })
    .select("id, fecha, exercise_slug, series")
    .maybeSingle<ExerciseLogRow>();
  if (error) {
    console.error("[workout] log insert:", error.message);
    return { ok: false, error: "no se pudo registrar — intenta de nuevo" };
  }
  if (!data) return { ok: false, error: "no se pudo registrar — intenta de nuevo" };

  revalidatePath(`/grupo/${parsed.data.grupoId}/rutina`);
  return { ok: true, data };
}

export async function removeExerciseLog(input: {
  grupoId: string;
  id: string;
}): Promise<Result> {
  const miembro = await getMiembro(input.grupoId);
  if (!miembro) return { ok: false, error: "sin sesión" };

  const supabase = await createClient();
  // Scoping explícito + verificación de fila afectada (lección deleteBodyScan: jamás
  // ok:true con 0 filas borradas en silencio).
  const { data, error } = await supabase
    .schema("core")
    .from("exercise_logs")
    .delete()
    .eq("id", input.id)
    .eq("miembro_id", miembro.id)
    .select("id");
  if (error) {
    console.error("[workout] log delete:", error.message);
    return { ok: false, error: "no se pudo borrar — intenta de nuevo" };
  }
  if (!data || data.length === 0) return { ok: false, error: "registro no encontrado" };

  revalidatePath(`/grupo/${input.grupoId}/rutina`);
  return { ok: true, data: undefined };
}
