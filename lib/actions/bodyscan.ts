"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic, NUTRITION_MODEL } from "@/lib/anthropic";
import { getEntitlement } from "@/lib/billing/tier";
import { logAppError } from "@/lib/observability/log";
import type { PerfilFisico } from "@/lib/nutrition/types";

export type BodyScan = {
  id: string;
  grasa_pct: number;
  musculo_pct: number;
  confianza: "baja" | "media" | "alta";
  recomendaciones: string[];
  source: "sample" | "ai";
  created_at: string;
};

/** Flag F6: el análisis con foto solo corre con flag explícito Y key presente. */
function isBodyScanLive(): boolean {
  return process.env.BODY_SCAN_LIVE === "true" && !!process.env.ANTHROPIC_API_KEY;
}

export async function getBodyScanContext(): Promise<{
  live: boolean;
  entitled: boolean;
  scans: BodyScan[];
}> {
  const { entitled } = await getEntitlement("body_scan");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { live: isBodyScanLive(), entitled, scans: [] };

  const { data, error } = await supabase
    .schema("core")
    .from("body_scans")
    .select("id, grasa_pct, musculo_pct, confianza, recomendaciones, source, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) console.error("[bodyscan] read:", error.message);

  return { live: isBodyScanLive(), entitled, scans: (data ?? []) as BodyScan[] };
}

async function getFisico(userId: string): Promise<PerfilFisico | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("peso_kg, altura_cm, edad, genero, nivel_actividad, objetivo, bmr_calculado")
    .eq("user_id", userId)
    .maybeSingle<PerfilFisico>();
  if (error) console.error("[bodyscan] perfil:", error.message);
  return data ?? null;
}

// Estimación antropométrica SIN foto (fail-soft honesto): Deurenberg sobre BMI/edad/género.
// No es invento ni foto stock: es una estimación real con los datos del perfil — exactamente
// lo que un sample debe ser. La IA con foto la refina cuando Miguel active la key.
function sampleScan(f: PerfilFisico): Omit<BodyScan, "id" | "created_at"> {
  const bmi = f.peso_kg / Math.pow(f.altura_cm / 100, 2);
  const sexo = f.genero === "masculino" ? 1 : 0;
  let grasa = 1.2 * bmi + 0.23 * f.edad - 10.8 * sexo - 5.4;
  grasa = Math.min(55, Math.max(5, Math.round(grasa * 10) / 10));
  // Masa muscular esquelética aproximada como fracción de la masa magra.
  const musculo = Math.min(60, Math.max(15, Math.round((100 - grasa) * 0.52 * 10) / 10));

  const recomendaciones =
    f.objetivo === "perder_grasa"
      ? [
          "Mantén el déficit moderado del plan — la báscula semanal manda, no la diaria.",
          "Prioriza proteína en cada comida para conservar músculo mientras bajas.",
          "Suma pasos diarios: el NEAT mueve más grasa que un extra de cardio.",
        ]
      : f.objetivo === "ganar_musculo"
        ? [
            "Progresa cargas cada semana — sin sobrecarga progresiva no hay músculo nuevo.",
            "Llega a tu objetivo de proteína todos los días, no solo los de entreno.",
            "Duerme 7-8h: la síntesis ocurre durmiendo, no en el gym.",
          ]
        : [
            "Mantén la consistencia del dúo — la racha es tu mejor métrica de salud.",
            "Combina fuerza y cardio en la semana para sostener composición.",
            "Re-escanea cada 4-6 semanas; los cambios reales son lentos.",
          ];

  return { grasa_pct: grasa, musculo_pct: musculo, confianza: "baja", recomendaciones, source: "sample" };
}

// OJO: structured outputs solo acepta un SUBSET de JSON Schema — minimum/maximum y
// minItems/maxItems>1 producen un 400 de la API (verificado contra los docs vigentes).
// Los rangos se validan/clampan en código tras el parse; el conteo va en description.
const SCAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["grasa_pct", "musculo_pct", "confianza", "recomendaciones"],
  properties: {
    grasa_pct: { type: "number", description: "porcentaje de grasa corporal, entre 2 y 70" },
    musculo_pct: { type: "number", description: "porcentaje de músculo esquelético, entre 10 y 70" },
    confianza: { type: "string", enum: ["baja", "media", "alta"] },
    recomendaciones: {
      type: "array",
      description: "exactamente 3 recomendaciones",
      items: { type: "string" },
    },
  },
} as const;

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Ejecuta el scan. Gated a Pro. Dos modos:
 *  · live (BODY_SCAN_LIVE + key): la foto (FormData) se procesa EN MEMORIA con Claude
 *    Vision y se descarta — solo persiste el resultado numérico.
 *  · sample: IGNORA cualquier foto (no se procesa ni se lee) y estima por antropometría.
 * El cliente exige doble consentimiento antes de invocar con foto.
 */
export async function runBodyScan(formData: FormData): Promise<Result<BodyScan>> {
  const { entitled } = await getEntitlement("body_scan");
  if (!entitled) return { ok: false, error: "requiere plan pro" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const fisico = await getFisico(user.id);
  if (!fisico) return { ok: false, error: "completa tu perfil físico primero" };

  let scan: Omit<BodyScan, "id" | "created_at">;

  if (!isBodyScanLive()) {
    // Modo sample: privacidad por diseño — la foto (si vino) no se toca.
    scan = sampleScan(fisico);
  } else {
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "falta la foto" };
    }
    if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: "foto demasiado grande (máx 8 MB)" };
    const mediaType = MEDIA_TYPES.find((m) => m === file.type);
    if (!mediaType) return { ok: false, error: "formato no soportado (jpg/png/webp)" };

    const consent = formData.get("consent") === "true" && formData.get("consent2") === "true";
    if (!consent) return { ok: false, error: "falta tu consentimiento" };

    const client = getAnthropic();
    if (!client) return { ok: false, error: "coming_soon" };

    // Control de costo (contrato del setup doc): máx 3 análisis con IA por usuario por día.
    // Si el conteo falla, NO se hace la llamada cara — mejor reintentar que gastar a ciegas.
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: cntErr } = await supabase
      .schema("core")
      .from("body_scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("source", "ai")
      .gte("created_at", desde);
    if (cntErr) {
      console.error("[bodyscan] límite:", cntErr.message);
      return { ok: false, error: "no se pudo verificar tu límite diario — intenta de nuevo" };
    }
    if ((count ?? 0) >= 3) {
      return { ok: false, error: "límite diario alcanzado (3 análisis con foto) — vuelve mañana" };
    }

    try {
      const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const msg = await client.messages
        .stream({
          model: NUTRITION_MODEL,
          max_tokens: 2000,
          thinking: { type: "adaptive" },
          output_config: { format: { type: "json_schema", schema: SCAN_SCHEMA } },
          system:
            "Eres el analizador corporal de dovo. Estimas composición corporal desde una foto " +
            "de cuerpo completo, como ESTIMACIÓN ORIENTATIVA (nunca diagnóstico). Tono directo " +
            "y motivador en español de México; recomendaciones accionables de entrenamiento y " +
            "alimentación, jamás consejo médico.",
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
                {
                  type: "text",
                  text:
                    `Estima la composición corporal de esta persona (${fisico.edad} años, ` +
                    `${fisico.genero}, ${fisico.peso_kg} kg, ${fisico.altura_cm} cm, objetivo: ${fisico.objetivo}). ` +
                    `Devuelve % de grasa, % de músculo esquelético, tu nivel de confianza y 3 recomendaciones ` +
                    `concretas alineadas a su objetivo. Si la foto no permite estimar (ropa muy holgada, ` +
                    `encuadre parcial), usa confianza "baja" y estima con la antropometría dada.`,
                },
              ],
            },
          ],
          // Cast vía unknown: params actuales de la API que los tipos del SDK pueden no conocer.
        } as unknown as Parameters<typeof client.messages.stream>[0])
        .finalMessage();

      const textBlock = msg.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("respuesta sin texto");
      const parsed = JSON.parse(textBlock.text) as Omit<BodyScan, "id" | "created_at" | "source">;
      // Rangos en código (el schema ya no los lleva): clamp a los CHECKs del SQL.
      if (
        typeof parsed.grasa_pct !== "number" || Number.isNaN(parsed.grasa_pct) ||
        typeof parsed.musculo_pct !== "number" || Number.isNaN(parsed.musculo_pct)
      ) throw new Error("respuesta sin porcentajes");
      const clamp1 = (v: number, lo: number, hi: number) =>
        Math.min(hi, Math.max(lo, Math.round(v * 10) / 10));
      const recos = (Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones : [])
        .filter((r): r is string => typeof r === "string" && r.length > 0)
        .slice(0, 3);
      if (recos.length === 0) throw new Error("respuesta sin recomendaciones");
      scan = {
        grasa_pct: clamp1(parsed.grasa_pct, 2, 70),
        musculo_pct: clamp1(parsed.musculo_pct, 10, 70),
        confianza: (["baja", "media", "alta"] as const).find((c) => c === parsed.confianza) ?? "media",
        recomendaciones: recos,
        source: "ai",
      };
    } catch (err) {
      // Fail-soft observable: la visión falla ⇒ estimación antropométrica, nunca un 500.
      // logAppError ⇒ visible en /admin (si solo quedara en Vercel logs, un modo live roto
      // degradaría a sample para siempre sin que nadie lo note).
      const mensaje = err instanceof Error ? err.message : String(err);
      console.error("[bodyscan-ai] fallback a sample:", mensaje);
      void logAppError({ origen: "bodyscan-ai", mensaje, userId: user.id });
      scan = sampleScan(fisico);
    }
    // La foto (b64/file) queda fuera de alcance aquí — nunca se persiste.
  }

  const { data, error } = await supabase
    .schema("core")
    .from("body_scans")
    .insert({
      user_id: user.id,
      grasa_pct: scan.grasa_pct,
      musculo_pct: scan.musculo_pct,
      confianza: scan.confianza,
      recomendaciones: scan.recomendaciones,
      source: scan.source,
    })
    .select("id, grasa_pct, musculo_pct, confianza, recomendaciones, source, created_at")
    .maybeSingle<BodyScan>();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "no se pudo guardar el resultado" };

  revalidatePath("/perfil/scan");
  revalidatePath("/perfil");
  return { ok: true, data };
}

export async function deleteBodyScan(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.schema("core").from("body_scans").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/perfil/scan");
  return { ok: true, data: undefined };
}
