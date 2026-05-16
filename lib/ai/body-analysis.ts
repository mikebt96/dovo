import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase";
import { downloadBodyPhoto } from "@/lib/storage";
import { BodyAnalysisSchema, type BodyAnalysis } from "@/lib/schemas/body-analysis";

/**
 * Pipeline: descargar foto del bucket → enviar a Claude Vision con tool-forced
 * JSON output → validar con Zod → persistir en body_photos.ai_analysis.
 *
 * Prompt caching:
 *  - system prompt + tool schema viven en `cache_control: ephemeral`.
 *  - La imagen NO se cachea (varía por llamada).
 *  - Hit rate esperado: alto (mismo prompt cada análisis), 5-min TTL.
 *
 * Model: Sonnet 4.6 (claude-sonnet-4-6) — Vision es comodity en Sonnet,
 * y Sonnet baja costo ~5× vs Opus para una task estructurada como esta.
 *
 * Estimación de costo por análisis: ~$0.005 con cache hit, ~$0.015 sin.
 */

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Eres un coach corporal especializado en composición física y técnica de movimiento. Analizas fotos de progreso de un usuario que sigue un plan de gimnasio + nutrición estructurado.

Tu tarea: observar la foto y producir un análisis EQUILIBRADO Y EMPÁTICO en español mexicano (CDMX), enfocado en:
- Calidad de la pose (¿se ve bien la zona que pretende mostrar?)
- Áreas visibles del cuerpo
- Observaciones objetivas sobre postura, definición muscular, composición
- Asimetrías visibles (sin obsesionar — solo si son evidentes)
- Hasta 5 recomendaciones de foco accionables

Reglas duras:
- NUNCA hacer diagnósticos médicos.
- NUNCA juzgar peso ni hacer comentarios sobre apariencia general/atractivo.
- Si la foto está mal encuadrada o muy oscura, dilo en pose_quality + caveats.
- Si no puedes ver una zona, NO la inventes.
- Tono: directo, sin floreos, sin sobreafirmar.

Devuelve SIEMPRE usando la tool 'body_analysis'. NUNCA respondas con texto libre.`;

// `Anthropic.Tool` espera input_schema con required: string[] (mutable),
// por eso evitamos `as const` aquí.
const TOOL_SCHEMA: Anthropic.Tool = {
  name: "body_analysis",
  description: "Análisis estructurado de una foto corporal",
  input_schema: {
    type: "object",
    properties: {
      pose_quality: {
        type: "string",
        enum: ["good", "partial", "poor"],
        description: "Qué tan bien encuadrada/iluminada está la foto",
      },
      visible_areas: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "shoulders", "chest", "back", "arms", "abs", "obliques",
            "glutes", "quads", "hamstrings", "calves", "full_body",
          ],
        },
      },
      observations: {
        type: "object",
        properties: {
          posture: { type: "string", maxLength: 500 },
          muscle_definition: { type: "string", maxLength: 500 },
          body_composition: { type: "string", maxLength: 500 },
          asymmetries: {
            type: "array",
            items: { type: "string", maxLength: 200 },
          },
        },
      },
      recommendations: {
        type: "array",
        maxItems: 5,
        items: {
          type: "object",
          required: ["focus", "suggestion"],
          properties: {
            focus: { type: "string", maxLength: 100 },
            suggestion: { type: "string", maxLength: 300 },
          },
        },
      },
      caveats: {
        type: "array",
        items: { type: "string", maxLength: 300 },
      },
    },
    required: ["pose_quality", "visible_areas", "observations", "recommendations"],
  },
};

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const env = getEnv();
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no está configurado");
  }
  _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _client;
}

/**
 * Llama Claude Vision con la foto del bucket y persiste el análisis en DB.
 * Diseñado para correr en background (fire-and-forget desde el upload).
 *
 * Falla suave: si la API falla, escribe un caveat en lugar de explotar.
 * El registro de body_photos queda sin ai_analysis y el user puede
 * "Reanalizar" desde la UI más tarde.
 */
export async function analyzeBodyPhoto(photo_id: number): Promise<{
  ok: boolean;
  error?: string;
}> {
  const sb = getServerSupabase();
  const { data: photo, error: readErr } = await sb
    .from("body_photos")
    .select("id, profile_id, storage_path, taken_on")
    .eq("id", photo_id)
    .single();
  if (readErr || !photo) {
    return { ok: false, error: "Foto no encontrada" };
  }

  const blob = await downloadBodyPhoto(photo.storage_path as string);
  if (!blob) {
    return { ok: false, error: "No pude descargar la imagen" };
  }

  const mediaType = blob.mime as "image/jpeg" | "image/png" | "image/webp";
  const base64 = Buffer.from(blob.buffer).toString("base64");

  let analysis: BodyAnalysis;
  try {
    const client = getClient();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "body_analysis" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Analiza esta foto tomada el ${photo.taken_on}. Devuelve usando la tool 'body_analysis'.`,
            },
          ],
        },
      ],
    });

    const toolUse = res.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude no devolvió tool_use");
    }

    // Inyectar la version literal antes de validar.
    const raw = {
      version: "v1" as const,
      ...(toolUse.input as Record<string, unknown>),
      generated_at: new Date().toISOString(),
    };
    analysis = BodyAnalysisSchema.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error desconocido";
    console.warn("[analyzeBodyPhoto] AI call failed:", msg);
    // Persistir un análisis "failed" con caveat — la UI lo distingue por pose_quality.
    analysis = {
      version: "v1",
      pose_quality: "poor",
      visible_areas: [],
      observations: {},
      recommendations: [],
      caveats: [`Análisis automático falló: ${msg}. Intenta de nuevo más tarde.`],
      generated_at: new Date().toISOString(),
    };
  }

  const { error: updErr } = await sb
    .from("body_photos")
    .update({ ai_analysis: analysis })
    .eq("id", photo_id);
  if (updErr) {
    console.warn(`[analyzeBodyPhoto] update failed: ${updErr.message}`);
    return { ok: false, error: updErr.message };
  }

  return { ok: true };
}
