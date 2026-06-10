"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isNutritionAiLive } from "@/lib/anthropic";
import { generateSample, generateWithAi } from "@/lib/nutrition/generate";
import { weekStartISO } from "@/lib/nutrition/macros";
import { getEntitlement } from "@/lib/billing/tier";
import type {
  MealPlanContent,
  MealPlanRow,
  NutritionProfile,
  PerfilFisico,
  Restriccion,
} from "@/lib/nutrition/types";
import { RESTRICCIONES } from "@/lib/nutrition/types";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type NutritionData = {
  fisico: PerfilFisico | null;
  nutricion: NutritionProfile | null;
  plan: MealPlanRow | null;
  logsHoy: Array<{ id: string; tipo: string; descripcion: string }>;
  aiLive: boolean;
};

async function getFisico(userId: string): Promise<PerfilFisico | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("peso_kg, altura_cm, edad, genero, nivel_actividad, objetivo, bmr_calculado")
    .eq("user_id", userId)
    .maybeSingle<PerfilFisico>();
  // Lectura de página: log + degrade (criterio F7), nunca en silencio.
  if (error) console.error("[nutrition] perfil_fisico:", error.message);
  return data ?? null;
}

export async function getNutritionData(): Promise<NutritionData> {
  const empty: NutritionData = { fisico: null, nutricion: null, plan: null, logsHoy: [], aiLive: isNutritionAiLive() };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const fisico = await getFisico(user.id);

  const { data: nutriRow, error: nutriErr } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .select("restricciones, presupuesto, comidas_por_dia, preferencias")
    .eq("user_id", user.id)
    .maybeSingle<NutritionProfile>();
  if (nutriErr) console.error("[nutrition] nutrition_profiles:", nutriErr.message);
  const nutricion = nutriRow ?? null;

  const week = weekStartISO();
  let plan: MealPlanRow | null = null;
  const { data: planRow, error: planErr } = await supabase
    .schema("core")
    .from("meal_plans")
    .select("id, week_start, source, plan")
    .eq("user_id", user.id)
    .eq("week_start", week)
    .maybeSingle<MealPlanRow>();
  if (planErr) console.error("[nutrition] meal_plans:", planErr.message);
  plan = planRow ?? null;

  // Sin plan esta semana pero con ambos perfiles ⇒ genera el SAMPLE al instante (idempotente
  // por unique(user_id, week_start)). El page load nunca llama a Claude — la IA es botón.
  if (!plan && fisico && nutricion) {
    const generated = generateSample(fisico, nutricion);
    const { data: inserted, error: insErr } = await supabase
      .schema("core")
      .from("meal_plans")
      .upsert(
        { user_id: user.id, week_start: week, source: generated.source, plan: generated.plan },
        { onConflict: "user_id,week_start" },
      )
      .select("id, week_start, source, plan")
      .maybeSingle<MealPlanRow>();
    if (insErr) console.error("[nutrition] meal_plans upsert:", insErr.message);
    plan = inserted ?? { id: "local", week_start: week, source: generated.source, plan: generated.plan };
  }

  const { data: logs, error: logsErr } = await supabase
    .schema("core")
    .from("food_logs")
    .select("id, tipo, descripcion")
    .eq("user_id", user.id)
    .eq("fecha", new Date().toISOString().slice(0, 10))
    .order("created_at", { ascending: true });
  if (logsErr) console.error("[nutrition] food_logs:", logsErr.message);

  return {
    fisico,
    nutricion,
    plan,
    logsHoy: (logs ?? []) as NutritionData["logsHoy"],
    aiLive: isNutritionAiLive(),
  };
}

export async function saveNutritionProfile(input: {
  restricciones: string[];
  presupuesto: string;
  comidas_por_dia: number;
  preferencias?: string;
}): Promise<Result> {
  const restricciones = input.restricciones.filter((r): r is Restriccion =>
    (RESTRICCIONES as string[]).includes(r),
  );
  const presupuesto = ["bajo", "medio", "alto"].includes(input.presupuesto)
    ? input.presupuesto
    : "medio";
  const comidas = Math.min(5, Math.max(3, Math.round(input.comidas_por_dia)));
  const preferencias = input.preferencias?.trim().slice(0, 300) || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error: upErr } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .upsert(
      { user_id: user.id, restricciones, presupuesto, comidas_por_dia: comidas, preferencias },
      { onConflict: "user_id" },
    );
  if (upErr) return { ok: false, error: upErr.message };

  // El perfil cambió ⇒ el plan de la semana ya no aplica: regenera el sample con el perfil nuevo.
  const fisico = await getFisico(user.id);
  if (fisico) {
    const generated = generateSample(fisico, {
      restricciones,
      presupuesto: presupuesto as NutritionProfile["presupuesto"],
      comidas_por_dia: comidas,
      preferencias,
    });
    const { error: planErr } = await supabase
      .schema("core")
      .from("meal_plans")
      .upsert(
        { user_id: user.id, week_start: weekStartISO(), source: generated.source, plan: generated.plan },
        { onConflict: "user_id,week_start" },
      );
    if (planErr) return { ok: false, error: planErr.message };
  }

  revalidatePath("/nutricion");
  return { ok: true, data: undefined };
}

/**
 * Regenera el plan de la semana con Claude (botón "personalizar con IA").
 * Gated: requiere tier Pro (FEATURE_TIERS.nutrition) + NUTRITION_AI_LIVE + key.
 * Sin IA viva devuelve coming_soon (la UI muestra "disponible al activar IA").
 */
export async function regenerateWithAi(): Promise<Result<{ source: "sample" | "ai" }>> {
  if (!isNutritionAiLive()) return { ok: false, error: "coming_soon" };

  const { entitled } = await getEntitlement("nutrition");
  if (!entitled) return { ok: false, error: "requiere plan pro" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const fisico = await getFisico(user.id);
  if (!fisico) return { ok: false, error: "completa tu perfil físico primero" };

  const { data: nutriRow, error: nutriErr } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .select("restricciones, presupuesto, comidas_por_dia, preferencias")
    .eq("user_id", user.id)
    .maybeSingle<NutritionProfile>();
  if (nutriErr) return { ok: false, error: nutriErr.message };
  if (!nutriRow) return { ok: false, error: "completa tu perfil nutricional primero" };

  // Control de costo (contrato del setup doc y de la migración F5): la regeneración con
  // Claude es SEMANAL — si el plan de esta semana ya es source='ai', no se vuelve a llamar.
  // Editar el perfil regenera el sample (source='sample'), lo que rehabilita 1 pasada de IA.
  const week = weekStartISO();
  const { data: existing, error: exErr } = await supabase
    .schema("core")
    .from("meal_plans")
    .select("source")
    .eq("user_id", user.id)
    .eq("week_start", week)
    .maybeSingle<{ source: string }>();
  if (exErr) {
    console.error("[nutrition] límite semanal:", exErr.message);
    return { ok: false, error: "no se pudo verificar tu plan — intenta de nuevo" };
  }
  if (existing?.source === "ai") {
    return { ok: false, error: "tu plan de esta semana ya es personalizado — la ia regenera cada semana" };
  }

  const generated = await generateWithAi(fisico, nutriRow);

  const { error: upErr } = await supabase
    .schema("core")
    .from("meal_plans")
    .upsert(
      { user_id: user.id, week_start: weekStartISO(), source: generated.source, plan: generated.plan as MealPlanContent },
      { onConflict: "user_id,week_start" },
    );
  if (upErr) return { ok: false, error: upErr.message };

  revalidatePath("/nutricion");
  return { ok: true, data: { source: generated.source } };
}

export async function logFood(input: {
  tipo: string;
  descripcion: string;
}): Promise<Result<{ id: string }>> {
  const tipo = ["desayuno", "comida", "cena", "snack"].includes(input.tipo)
    ? input.tipo
    : "comida";
  const descripcion = input.descripcion.trim();
  if (!descripcion) return { ok: false, error: "escribe qué comiste" };
  if (descripcion.length > 200) return { ok: false, error: "máximo 200 caracteres" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data, error } = await supabase
    .schema("core")
    .from("food_logs")
    .insert({ user_id: user.id, tipo, descripcion })
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "no se pudo registrar" };
  revalidatePath("/nutricion");
  return { ok: true, data: { id: data.id } };
}

export async function removeFoodLog(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.schema("core").from("food_logs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/nutricion");
  return { ok: true, data: undefined };
}
