"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isNutritionAiLive } from "@/lib/anthropic";
import { generateSample, generateWithAi } from "@/lib/nutrition/generate";
import { macrosObjetivo, weekStartISO } from "@/lib/nutrition/macros";
import { getEntitlement } from "@/lib/billing/tier";
import type {
  Comida,
  DuoNutricion,
  MealPlanContent,
  MealPlanRow,
  NutritionProfile,
  PerfilFisico,
  Restriccion,
} from "@/lib/nutrition/types";
import { RESTRICCIONES } from "@/lib/nutrition/types";
import { candidatosSwap, escalaComida } from "@/lib/nutrition/sample-plans";

export type NutritionData = {
  fisico: PerfilFisico | null;
  nutricion: NutritionProfile | null;
  plan: MealPlanRow | null;
  logsHoy: Array<{ id: string; tipo: string; descripcion: string }>;
  aiLive: boolean;
  // plan de dúo: la DOSIS del compa (mismos platillos, sus kcal) — null si no
  // hay dúo configurado. kcal por la MISMA fórmula (macrosObjetivo).
  dosisCompa: { nombre: string; kcal: number } | null;
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

// ── Plan de dúo (regla de oro): UN plan, dosis de cada quien. Los insumos del
// compa son ilegibles por RLS — la RPC definer duo_nutricion los expone gated.
// Si AMBOS están configurados, el motor genera con la UNIÓN (mismos platillos
// para los dos; cada quien genera el suyo con kcal personales — el determinismo
// sincroniza sin coordinación). Si no, plan individual.
type DuoInfo = {
  ctx: DuoNutricion;
  compa: { nombre: string; kcal: number } | null;
};

async function getDuoInfo(userId: string): Promise<DuoInfo> {
  const vacio: DuoInfo = { ctx: null, compa: null };
  const supabase = await createClient();
  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle<{ trato_id: string }>();
  if (!miembro) return vacio;

  const { data: filas, error } = await supabase
    .schema("core")
    .rpc("duo_nutricion", { p_trato_id: miembro.trato_id });
  if (error) {
    console.error("[nutrition] duo_nutricion:", error.message);
    return vacio;
  }
  const rows = (filas ?? []) as Array<{
    user_id: string;
    nombre: string;
    objetivo: string | null;
    restricciones: string[];
    vetos: string[];
    menus_distintos: number;
    peso_kg: number | null;
    altura_cm: number | null;
    edad: number | null;
    genero: string | null;
    nivel_actividad: string | null;
    bmr_calculado: number | null;
    listo: boolean;
  }>;
  // dúo real: 2+ miembros y TODOS con perfil físico + nutricional
  if (rows.length < 2 || rows.some((r) => !r.listo)) return vacio;

  const ctx: DuoNutricion = {
    objetivos: rows.map((r) => r.objetivo as PerfilFisico["objetivo"]),
    restricciones: Array.from(
      new Set(rows.flatMap((r) => r.restricciones)),
    ) as Restriccion[],
    vetos: Array.from(new Set(rows.flatMap((r) => r.vetos))),
    menusDistintos: Math.min(...rows.map((r) => r.menus_distintos)),
  };

  // la dosis del compa: sus kcal con la MISMA fórmula que las tuyas
  const otro = rows.find((r) => r.user_id !== userId);
  let compa: DuoInfo["compa"] = null;
  if (otro && otro.peso_kg && otro.altura_cm && otro.edad) {
    const m = macrosObjetivo({
      peso_kg: Number(otro.peso_kg),
      altura_cm: Number(otro.altura_cm),
      edad: otro.edad,
      genero: otro.genero ?? "otro",
      nivel_actividad: (otro.nivel_actividad ??
        "moderado") as PerfilFisico["nivel_actividad"],
      objetivo: (otro.objetivo ?? "mantener") as PerfilFisico["objetivo"],
      bmr_calculado: otro.bmr_calculado ? Number(otro.bmr_calculado) : null,
    });
    compa = { nombre: otro.nombre, kcal: m.kcal };
  }

  return { ctx, compa };
}

export async function getNutritionData(): Promise<NutritionData> {
  const empty: NutritionData = { fisico: null, nutricion: null, plan: null, logsHoy: [], aiLive: isNutritionAiLive(), dosisCompa: null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const fisico = await getFisico(user.id);

  const { data: nutriRow, error: nutriErr } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .select("restricciones, presupuesto, comidas_por_dia, preferencias, menus_distintos, vetos, favoritos")
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
  const duoInfo = await getDuoInfo(user.id);
  if (!plan && fisico && nutricion) {
    const generated = generateSample(fisico, nutricion, duoInfo.ctx);
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
    // CDMX, no UTC: tras las 18:00 los logs caían en "mañana" (lección F9/F15)
    .eq("fecha", new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date()))
    .order("created_at", { ascending: true });
  if (logsErr) console.error("[nutrition] food_logs:", logsErr.message);

  return {
    fisico,
    nutricion,
    plan,
    logsHoy: (logs ?? []) as NutritionData["logsHoy"],
    aiLive: isNutritionAiLive(),
    dosisCompa: plan?.plan.duo ? duoInfo.compa : null,
  };
}

export async function saveNutritionProfile(input: {
  restricciones: string[];
  presupuesto: string;
  comidas_por_dia: number;
  preferencias?: string;
  menus_distintos?: number;
}): Promise<Result> {
  const restricciones = input.restricciones.filter((r): r is Restriccion =>
    (RESTRICCIONES as string[]).includes(r),
  );
  const presupuesto = ["bajo", "medio", "alto"].includes(input.presupuesto)
    ? input.presupuesto
    : "medio";
  const comidas = Math.min(5, Math.max(3, Math.round(input.comidas_por_dia)));
  const preferencias = input.preferencias?.trim().slice(0, 300) || null;
  const menus = [3, 5, 7].includes(input.menus_distintos ?? 5)
    ? (input.menus_distintos ?? 5)
    : 5;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  // vetos/favoritos NO se tocan aquí (los administra la palomita) — el upsert
  // de PostgREST solo SETea las columnas presentes en el payload.
  const { error: upErr } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .upsert(
      {
        user_id: user.id,
        restricciones,
        presupuesto,
        comidas_por_dia: comidas,
        preferencias,
        menus_distintos: menus,
      },
      { onConflict: "user_id" },
    );
  if (upErr) return { ok: false, error: upErr.message };

  // El perfil cambió ⇒ el plan de la semana ya no aplica: regenera el sample
  // con el perfil COMPLETO (incl. vetos/favoritos vivos) y el contexto de dúo.
  const fisico = await getFisico(user.id);
  if (fisico) {
    const { data: full } = await supabase
      .schema("core")
      .from("nutrition_profiles")
      .select("restricciones, presupuesto, comidas_por_dia, preferencias, menus_distintos, vetos, favoritos")
      .eq("user_id", user.id)
      .maybeSingle<NutritionProfile>();
    const duo = (await getDuoInfo(user.id)).ctx;
    const generated = generateSample(
      fisico,
      full ?? {
        restricciones,
        presupuesto: presupuesto as NutritionProfile["presupuesto"],
        comidas_por_dia: comidas,
        preferencias,
        menus_distintos: menus,
        vetos: [],
        favoritos: [],
      },
      duo,
    );
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
  revalidatePath("/");
  return { ok: true, data: undefined };
}

// ── La palomita de "no me gustó" (spec del founder): el alimento se CAMBIA en
// automático por un equivalente (mismo tipo, mismas restricciones, sin vetos)
// y el veto se recuerda para siempre — no vuelve a aparecer en ningún menú. ──
export async function vetarComida(input: {
  diaIdx: number;
  comidaIdx: number;
}): Promise<Result<{ nueva: Comida | null }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const fisico = await getFisico(user.id);
  const { data: perfil } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .select("restricciones, presupuesto, comidas_por_dia, preferencias, menus_distintos, vetos, favoritos")
    .eq("user_id", user.id)
    .maybeSingle<NutritionProfile>();
  if (!fisico || !perfil) return { ok: false, error: "completa tu perfil primero" };

  const week = weekStartISO();
  const { data: planRow, error: planErr } = await supabase
    .schema("core")
    .from("meal_plans")
    .select("id, week_start, source, plan")
    .eq("user_id", user.id)
    .eq("week_start", week)
    .maybeSingle<MealPlanRow>();
  if (planErr) return { ok: false, error: planErr.message };
  if (!planRow) return { ok: false, error: "aún no hay plan esta semana" };

  const dia = planRow.plan.dias[input.diaIdx];
  const comida = dia?.comidas[input.comidaIdx];
  if (!comida) return { ok: false, error: "comida no encontrada" };

  // el veto se recuerda SIEMPRE (aunque no haya reemplazo disponible)
  const vetos = Array.from(new Set([...perfil.vetos, comida.nombre]));

  const duo = (await getDuoInfo(user.id)).ctx;
  const objetivosDistintos = duo && new Set(duo.objetivos).size > 1;
  const objetivo = objetivosDistintos ? "mantener" : fisico.objetivo;
  const restricciones = duo ? duo.restricciones : perfil.restricciones;
  const vetosEfectivos = duo ? Array.from(new Set([...duo.vetos, ...vetos])) : vetos;

  // candidato: mismo tipo, sin vetos, sin repetir lo que ya hay en el día
  const enElDia = dia.comidas.map((c) => c.nombre);
  let candidatos = candidatosSwap(objetivo, comida.tipo, restricciones, vetosEfectivos, enElDia);
  if (!candidatos.length) {
    candidatos = candidatosSwap(objetivo, comida.tipo, restricciones, vetosEfectivos, []);
  }
  const cruda = candidatos[(input.diaIdx + input.comidaIdx) % Math.max(1, candidatos.length)] ?? null;
  const nueva = cruda ? escalaComida(cruda, planRow.plan.factor_porcion ?? 1) : null;

  if (nueva) {
    const plan: MealPlanContent = {
      ...planRow.plan,
      dias: planRow.plan.dias.map((d, di) =>
        di !== input.diaIdx
          ? d
          : { ...d, comidas: d.comidas.map((c, ci) => (ci === input.comidaIdx ? nueva : c)) },
      ),
    };
    const { error: upPlanErr } = await supabase
      .schema("core")
      .from("meal_plans")
      .update({ plan })
      .eq("id", planRow.id);
    if (upPlanErr) return { ok: false, error: upPlanErr.message };
  }

  const { error: upVetoErr } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .update({ vetos })
    .eq("user_id", user.id);
  if (upVetoErr) return { ok: false, error: upVetoErr.message };

  revalidatePath("/nutricion");
  return { ok: true, data: { nueva } };
}

// "Me gustó": el motor lo prefiere en planes futuros (toggle).
export async function marcarFavorito(nombre: string): Promise<Result<{ favorito: boolean }>> {
  const limpio = nombre.trim().slice(0, 120);
  if (!limpio) return { ok: false, error: "alimento inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { data: perfil } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .select("favoritos")
    .eq("user_id", user.id)
    .maybeSingle<{ favoritos: string[] }>();
  if (!perfil) return { ok: false, error: "completa tu perfil primero" };

  const ya = perfil.favoritos.includes(limpio);
  const favoritos = ya
    ? perfil.favoritos.filter((f) => f !== limpio)
    : [...perfil.favoritos, limpio];

  const { error } = await supabase
    .schema("core")
    .from("nutrition_profiles")
    .update({ favoritos })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: { favorito: !ya } };
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
