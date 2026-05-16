import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { collectWeekData, type WeekData } from "@/lib/weekly-review-data";
import {
  WeeklyRecommendationsSchema,
  type WeeklyRecommendations,
} from "@/lib/schemas/weekly-review";
import type { ProfileId } from "@/lib/types";

/**
 * Coach review semanal: Claude lee toda la semana de un perfil y devuelve
 *   - summary_md: 2-3 párrafos en markdown contando la semana
 *   - body_analysis_md: 1 párrafo sintetizando lo que vio en fotos
 *   - recommendations: estructurado (WeeklyRecommendationsSchema)
 *
 * Tool-forced JSON garantiza la shape exacta. Prompt caching del system
 * + tool schema baja costo por ~3x cuando el cron corre 2 profiles
 * back-to-back (cache hit en la segunda llamada).
 */

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Eres un coach personal de pareja en CDMX. Revisas cada domingo la semana que terminó: comidas marcadas, entrenamientos, actividades extra (ballet/pilates/running), peso, fotos de progreso y rachas.

Tu salida tiene 3 partes:

1) summary_md — 2-3 párrafos en markdown breve. Tono directo, mexicano sin clichés. Reconoce lo bueno, nombra lo flojo, no moralizas. Si la semana fue parcial, no infles. Si fue completa, celebra sin cursilería.

2) body_analysis_md — 1 párrafo sobre lo que se ve en las fotos de esta semana (si las hay). Foco en composición, definición y postura observable. Si no hay fotos, di "Sin fotos esta semana" y pasa.

3) recommendations — estructurado:
   • kcal_next_week: ajusta delta vs baseline si la trayectoria de peso lo justifica
   • protein_g_next_week: solo si el log lo amerita
   • training_changes: hasta 5 cambios concretos (volume_up/volume_down/deload/swap/add/remove + qué músculo)
   • alerts: hasta 5 (info/warning/critical) sobre patrones preocupantes
   • encouragement: 1 frase. Una. No 3.

Reglas duras:
- NUNCA hagas diagnóstico médico ni recomendaciones nutricionales agresivas (>250 kcal delta sin justificación).
- NUNCA juzgues peso ni hagas comentarios morales sobre la comida.
- Si los datos son MUY pobres (menos de 3 días con meals), súbelo a alerts.severity="warning" y NO inventes recomendaciones.
- Tono: directo, sin sobreafirmar, sin floreos new-age.

Devuelve SIEMPRE usando la tool 'weekly_review'.`;

const TOOL_SCHEMA: Anthropic.Tool = {
  name: "weekly_review",
  description: "Resumen semanal estructurado del progreso de un perfil",
  input_schema: {
    type: "object",
    properties: {
      summary_md: { type: "string", maxLength: 2000 },
      body_analysis_md: { type: "string", maxLength: 1500 },
      recommendations: {
        type: "object",
        properties: {
          kcal_next_week: {
            type: "object",
            properties: {
              delta: { type: "integer", minimum: -500, maximum: 500 },
              reason: { type: "string", maxLength: 300 },
            },
            required: ["delta", "reason"],
          },
          protein_g_next_week: {
            type: "object",
            properties: {
              target: { type: "integer", minimum: 50, maximum: 300 },
              reason: { type: "string", maxLength: 300 },
            },
            required: ["target", "reason"],
          },
          training_changes: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              required: ["change_type", "target", "reason"],
              properties: {
                change_type: {
                  type: "string",
                  enum: ["volume_up", "volume_down", "deload", "swap", "add", "remove"],
                },
                target: { type: "string", maxLength: 150 },
                reason: { type: "string", maxLength: 300 },
              },
            },
          },
          alerts: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              required: ["severity", "message"],
              properties: {
                severity: { type: "string", enum: ["info", "warning", "critical"] },
                message: { type: "string", maxLength: 400 },
              },
            },
          },
          encouragement: { type: "string", maxLength: 500 },
        },
      },
    },
    required: ["summary_md", "recommendations"],
  },
};

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const env = getEnv();
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no configurado");
  }
  _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _client;
}

export type ReviewResult =
  | { ok: true; week_start: string }
  | { ok: false; error: string };

/**
 * Genera (o regenera) el weekly review para un (slug, week_start).
 * UPSERT a weekly_reviews — segunda corrida sobrescribe la primera.
 */
export async function generateWeeklyReview(
  slug: ProfileId,
  week_start: string,
): Promise<ReviewResult> {
  const data = await collectWeekData(slug, week_start);
  if (!data) return { ok: false, error: "No pude recolectar datos" };

  const profile_id = await slugToUuid(slug);
  if (!profile_id) return { ok: false, error: "Perfil no encontrado" };

  // Si la semana está prácticamente vacía, evita la llamada AI: genera un
  // review mínimo de "semana sin datos". Ahorra costos y es honesto.
  if (data.streak.days_active_this_week < 2) {
    const empty: WeeklyRecommendations = {
      version: "v1",
      alerts: [
        {
          severity: "warning",
          message:
            "Semana con poca actividad registrada — no hay datos suficientes para recomendar ajustes.",
        },
      ],
      encouragement: "Empezar de nuevo el lunes vale más que cerrar mal la semana pasada.",
    };
    await upsertReview({
      profile_id,
      week_start,
      summary_md: `**Semana ${data.week_start} → ${data.week_end}**\n\nSin actividad suficiente para revisar. Cuando marcas al menos 3 días de comidas, vuelvo con un análisis real.`,
      body_analysis_md: data.photos.length === 0 ? "Sin fotos esta semana." : null,
      recommendations: empty,
    });
    return { ok: true, week_start };
  }

  let summary_md: string;
  let body_analysis_md: string | null;
  let recommendations: WeeklyRecommendations;

  try {
    const client = getClient();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "weekly_review" },
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: buildUserPrompt(data) }],
        },
      ],
    });

    const tool = res.content.find((b) => b.type === "tool_use");
    if (!tool || tool.type !== "tool_use") {
      throw new Error("Claude no devolvió tool_use");
    }
    const out = tool.input as {
      summary_md: string;
      body_analysis_md?: string;
      recommendations: Record<string, unknown>;
    };

    summary_md = out.summary_md;
    body_analysis_md = out.body_analysis_md ?? null;
    recommendations = WeeklyRecommendationsSchema.parse({
      version: "v1",
      ...out.recommendations,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error desconocido";
    console.warn("[weeklyReview] AI failed:", msg);
    return { ok: false, error: msg };
  }

  await upsertReview({
    profile_id,
    week_start,
    summary_md,
    body_analysis_md,
    recommendations,
  });

  return { ok: true, week_start };
}

function buildUserPrompt(data: WeekData): string {
  const lines: string[] = [];
  lines.push(`# Perfil: ${data.profile.display_name} (${data.profile.slug})`);
  lines.push(`Goal: ${data.profile.goal ?? "—"}`);
  lines.push(
    `Baseline: ${data.profile.baseline_kcal ?? "—"} kcal · ${data.profile.baseline_protein_g ?? "—"}g protein`,
  );
  if (data.profile.dietary_tags.length > 0) {
    lines.push(`Dietary: ${data.profile.dietary_tags.join(", ")}`);
  }
  if (data.profile.notes_for_ai) {
    lines.push(`Notas user: ${data.profile.notes_for_ai}`);
  }
  lines.push("");
  lines.push(`# Semana ${data.week_start} → ${data.week_end}`);
  lines.push(
    `Racha actual: ${data.streak.current}d · récord: ${data.streak.longest}d · días activos esta semana: ${data.streak.days_active_this_week}/7`,
  );
  lines.push("");

  // Meals agrupadas por día
  const mealsByDay = new Map<string, typeof data.meals>();
  for (const m of data.meals) {
    const list = mealsByDay.get(m.date) ?? [];
    list.push(m);
    mealsByDay.set(m.date, list);
  }
  lines.push("## Comidas marcadas");
  if (mealsByDay.size === 0) {
    lines.push("(ninguna)");
  } else {
    for (const [date, list] of [...mealsByDay.entries()].sort()) {
      const totalKcal = list.reduce((a, m) => a + (m.kcal ?? 0), 0);
      const totalP = list.reduce((a, m) => a + (m.protein_g ?? 0), 0);
      lines.push(`- ${date}: ${list.length} meals · ${totalKcal} kcal · ${totalP}g P`);
    }
  }
  lines.push("");

  // Exercises agrupados
  if (data.exercises.length > 0) {
    lines.push("## Ejercicios (gym)");
    const byDate = new Map<string, typeof data.exercises>();
    for (const e of data.exercises) {
      const list = byDate.get(e.date) ?? [];
      list.push(e);
      byDate.set(e.date, list);
    }
    for (const [date, list] of [...byDate.entries()].sort()) {
      const total = list.reduce((a, e) => a + e.total_volume_kg, 0);
      const rpes = list
        .map((e) => e.avg_rpe)
        .filter((x): x is number => x !== null);
      const avgRpe = rpes.length === 0 ? "—" : (rpes.reduce((a, b) => a + b) / rpes.length).toFixed(1);
      lines.push(
        `- ${date}: ${list.length} ejercicios · ${total.toFixed(0)} kg·rep total · RPE prom ${avgRpe}`,
      );
    }
    lines.push("");
  }

  // Activities
  if (data.activities.length > 0) {
    lines.push("## Actividades (no-gym)");
    for (const a of data.activities) {
      lines.push(
        `- ${a.date}: ${a.type} · ${a.duration_min}min · intensidad ${a.intensity ?? "—"}`,
      );
    }
    lines.push("");
  }

  // Weights
  if (data.weights.length > 0) {
    lines.push("## Peso");
    const first = data.weights[0];
    const last = data.weights[data.weights.length - 1];
    const delta = (last.weight_kg - first.weight_kg).toFixed(2);
    lines.push(
      `${first.date}: ${first.weight_kg}kg → ${last.date}: ${last.weight_kg}kg (Δ ${delta}kg, ${data.weights.length} mediciones)`,
    );
    lines.push("");
  }

  // Photos
  if (data.photos.length > 0) {
    lines.push("## Fotos analizadas esta semana");
    for (const p of data.photos) {
      lines.push(
        `- ${p.taken_on} (pose: ${p.pose_quality ?? "—"}, áreas: ${p.visible_areas.join(", ") || "—"}): ${p.observations_summary ?? "sin observaciones"}`,
      );
    }
    lines.push("");
  } else {
    lines.push("## Fotos");
    lines.push("(sin fotos esta semana)");
    lines.push("");
  }

  lines.push("Genera el review usando la tool 'weekly_review'.");
  return lines.join("\n");
}

// Helper de identidad para inferencia (workaround TS)
function identity<T>(x: T): T {
  return x;
}

async function upsertReview(args: {
  profile_id: string;
  week_start: string;
  summary_md: string;
  body_analysis_md: string | null;
  recommendations: WeeklyRecommendations;
}): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb.from("weekly_reviews").upsert(
    {
      profile_id: args.profile_id,
      week_start: args.week_start,
      summary_md: args.summary_md,
      body_analysis_md: args.body_analysis_md,
      recommendations: args.recommendations,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,week_start" },
  );
  if (error) {
    console.warn(`[weeklyReview] upsert failed: ${error.message}`);
  }
}
