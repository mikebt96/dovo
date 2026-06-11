import "server-only";
import { getAnthropic, isNutritionAiLive, NUTRITION_MODEL } from "@/lib/anthropic";
import { logAppError } from "@/lib/observability/log";
import type { DuoNutricion, MealPlanContent, NutritionProfile, PerfilFisico } from "./types";
import { macrosObjetivo } from "./macros";
import { buildSamplePlan } from "./sample-plans";

// Generación del meal plan semanal. Contrato fail-soft:
//   · sin IA (flag/key) ⇒ sample determinista (instantáneo, nunca falla).
//   · con IA ⇒ Claude con STRUCTURED OUTPUT (el JSON llega conforme al schema, sin regex);
//     cualquier error de la API cae al sample (logueado, jamás 500 al usuario).
// El page load NUNCA llama a Claude — solo la action regenerateWithAi (botón explícito).

export type GeneratedPlan = { source: "sample" | "ai"; plan: MealPlanContent };

export function generateSample(
  fisico: PerfilFisico,
  nutricion: NutritionProfile,
  duo: DuoNutricion = null,
): GeneratedPlan {
  return { source: "sample", plan: buildSamplePlan(fisico, nutricion, duo) };
}

// JSON Schema del plan — misma forma que MealPlanContent (lib/nutrition/types.ts).
const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kcal_objetivo", "macros", "dias", "lista_super", "nota"],
  properties: {
    kcal_objetivo: { type: "integer" },
    macros: {
      type: "object",
      additionalProperties: false,
      required: ["prot", "carb", "grasa"],
      properties: {
        prot: { type: "integer" },
        carb: { type: "integer" },
        grasa: { type: "integer" },
      },
    },
    // OJO: structured outputs solo acepta un SUBSET de JSON Schema — minItems/maxItems>1
    // producen un 400 de la API. El conteo va en description + se valida en assertPlanShape.
    dias: {
      type: "array",
      description: "exactamente 7 días, lunes a domingo",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["dia", "comidas"],
        properties: {
          dia: { type: "string", enum: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"] },
          comidas: {
            type: "array",
            description: "entre 3 y 5 comidas según comidas_por_dia del usuario",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["tipo", "nombre", "descripcion", "kcal", "prot", "carb", "grasa"],
              properties: {
                tipo: { type: "string", enum: ["desayuno", "comida", "cena", "snack"] },
                nombre: { type: "string" },
                descripcion: { type: "string" },
                kcal: { type: "integer" },
                prot: { type: "integer" },
                carb: { type: "integer" },
                grasa: { type: "integer" },
              },
            },
          },
        },
      },
    },
    lista_super: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pasillo", "items"],
        properties: {
          pasillo: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
      },
    },
    nota: { type: "string" },
  },
} as const;

function buildPrompt(fisico: PerfilFisico, nutricion: NutritionProfile): string {
  const m = macrosObjetivo(fisico);
  return [
    `Genera un plan de comidas SEMANAL (lunes a domingo) en español de México para esta persona:`,
    `- ${fisico.edad} años, ${fisico.genero}, ${fisico.peso_kg} kg, ${fisico.altura_cm} cm`,
    `- Objetivo: ${fisico.objetivo} · Actividad: ${fisico.nivel_actividad}`,
    `- Objetivo calórico diario: ~${m.kcal} kcal (proteína ${m.prot} g · carbohidrato ${m.carb} g · grasa ${m.grasa} g)`,
    `- Comidas por día: ${nutricion.comidas_por_dia} (3 = desayuno/comida/cena; 4+ agrega snack)`,
    `- Restricciones (OBLIGATORIAS, ninguna comida puede violarlas): ${nutricion.restricciones.length ? nutricion.restricciones.join(", ") : "ninguna"}`,
    `- Presupuesto: ${nutricion.presupuesto} (bajo = ingredientes económicos de mercado/tianguis)`,
    nutricion.preferencias ? `- Preferencias del usuario: ${nutricion.preferencias}` : "",
    ``,
    `Reglas:`,
    `- Cocina mexicana casera y accesible; ingredientes de supermercado/mercado en México.`,
    `- Cada día debe quedar a ±10% del objetivo calórico; reparte la proteína entre comidas.`,
    `- "lista_super" agrupa TODOS los ingredientes de la semana por pasillo (frutas y verduras / proteínas / abarrotes / lácteos).`,
    `- "nota" = 1-2 frases de consejo práctico para la semana, tono directo, sin jerga médica.`,
    `- NO des consejo médico ni claims de salud; es un plan orientativo de alimentación.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Valida lo mínimo que la UI asume (defensa extra sobre el structured output).
 *  Los conteos viven aquí, no en el schema (structured outputs no soporta min/maxItems>1). */
function assertPlanShape(p: MealPlanContent): void {
  if (!Array.isArray(p.dias) || p.dias.length !== 7) throw new Error("plan sin 7 días");
  if (p.dias.some((d) => !Array.isArray(d.comidas) || d.comidas.length < 3 || d.comidas.length > 5))
    throw new Error("día con comidas fuera de 3-5");
  if (!Array.isArray(p.lista_super) || p.lista_super.length === 0) throw new Error("plan sin lista del súper");
}

export async function generateWithAi(
  fisico: PerfilFisico,
  nutricion: NutritionProfile,
): Promise<GeneratedPlan> {
  const client = getAnthropic();
  if (!client || !isNutritionAiLive()) return generateSample(fisico, nutricion);

  try {
    // Streaming + finalMessage(): evita timeouts HTTP con outputs largos (plan de 7 días).
    const msg = await client.messages
      .stream({
        model: NUTRITION_MODEL,
        max_tokens: 8000,
        thinking: { type: "adaptive" },
        output_config: { format: { type: "json_schema", schema: PLAN_SCHEMA } },
        system:
          "Eres el planificador de nutrición de dovo, una app fitness mexicana para dúos. " +
          "Generas planes de comida semanales realistas, mexicanos y accesibles. " +
          "Nunca das consejo médico; tus planes son orientativos.",
        messages: [{ role: "user", content: buildPrompt(fisico, nutricion) }],
        // Cast vía unknown: `output_config`/`thinking:adaptive` son params actuales de la API
        // que los tipos del SDK instalado pueden no conocer aún; el SDK envía el body tal cual.
      } as unknown as Parameters<typeof client.messages.stream>[0])
      .finalMessage();

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("respuesta sin bloque de texto");
    const plan = JSON.parse(textBlock.text) as MealPlanContent;
    assertPlanShape(plan);
    return { source: "ai", plan };
  } catch (err) {
    // Fail-soft observable: la IA nunca rompe la experiencia — cae al plan base y queda log
    // en /admin (sin esto, un modo live roto degradaría a sample para siempre sin señal).
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error("[nutrition-ai] fallback a sample:", mensaje);
    void logAppError({ origen: "nutrition-ai", mensaje });
    return generateSample(fisico, nutricion);
  }
}
