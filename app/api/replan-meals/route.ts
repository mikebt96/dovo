import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MEALS } from "@/lib/data/meals";
import { isProfileId, PROFILES } from "@/lib/profile";
import {
  getDietaryProfile,
  getNotificationSettings,
  slugToUuid,
} from "@/lib/profileServer";
import { getServerSupabase } from "@/lib/supabase";
import { sendWhatsApp } from "@/lib/whatsapp";
import { buildReplanMessage } from "@/lib/notifications";
import type { MealChange } from "@/lib/types";

/**
 * POST /api/replan-meals
 * Body: { slug: 'mike'|'andy', triggeredBy: 'prefs_changed'|'manual' }
 *
 * Auth: header `x-internal-secret: $CRON_SECRET` (server-side only).
 * Claude rewrites meals para que respeten las prefs del user. Append-only
 * en `meal_replans` para auditoría/undo.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Eres un coach nutricional para Mike & Andy, pareja mexicana en CDMX.

TU TAREA: Reescribir las comidas que ROMPAN las preferencias del usuario, manteniendo el resto idénticas.

REGLAS DURAS (no negociables):
1. Sin allergens ni disliked_ingredients del user.
2. dietary_tags:
   - "vegan" → cero animal (sin huevo/lácteo/miel)
   - "vegetarian" → sin carne ni pescado (huevo/lácteo OK)
   - "no-gluten" → sin trigo/cebada/centeno/seitán
   - "no-dairy" → sin leche/queso/yogurt/crema/mantequilla
   - "no-eggs" → sin huevo en ninguna forma
3. Macros: ±15% kcal y proteinG vs el original.
4. INGREDIENTES DISPONIBLES: solo cosas que existen en Walmart, Soriana, Chedraui
   o Sumesa MX. Cero kale, cero quinoa, cero ingredientes premium gringos.
   Prioridad: tortillas, frijoles, tofu, queso panela/Oaxaca, aguacate, salsas mx,
   avena, plátano, fresas, huevo, leche, almendras.
5. HARD LIMIT: máximo 15 min de prep (incluye licuado/microondas). Si el
   original era más largo, simplifica el método.
6. CONTEXTO DE PAREJA: Mike y Andy comen juntos cuando sus horarios coinciden
   (mira slotName y time). Si la meal original era compartida o paralela con
   la del partner (mismo slotName, time cercano), la nueva versión debe mantener
   compatibilidad: mismos ingredientes base, mismo "feel", aunque varíen porciones
   y proteína (uno carnivor / otro vegetal).

REGLAS BLANDAS:
- Priorizar liked_ingredients del user.
- Respetar max_meal_kcal si está set.
- Obedecer notes_for_ai.
- Voz: directa, mexicana, sin diminutivos cursi.

FORMATO DE SALIDA: JSON estricto, sin markdown, sin prefacios. Schema:
{
  "changes": [
    {
      "originalId": "lun-mk-2",
      "newName": "Tacos de frijoles con aguacate",
      "newIngredients": "4 tortillas · 150g frijoles · aguacate · pico · limón · Tajín",
      "newPrepInstructions": "Calienta frijoles 90s. Arma 4 tacos. 3 min.",
      "newKcal": 640,
      "newProteinG": 38,
      "reason": "Sustituí panela y huevo (no-dairy + no-eggs). Mantuve kcal ±10%."
    }
  ]
}

REQUERIDO: incluye SIEMPRE newKcal y newProteinG numéricos. Si no los pones, el cambio se rechaza. Estima los macros calculando los ingredientes nuevos.

Si NINGUNA comida necesita cambio: {"changes": []}.`;

interface RequestBody {
  slug?: string;
  triggeredBy?: "prefs_changed" | "manual";
}

export async function POST(req: Request) {
  // Auth: solo permitir internal calls
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as RequestBody;
  const { slug, triggeredBy = "prefs_changed" } = body;
  if (!slug || !isProfileId(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  const prefs = await getDietaryProfile(slug);
  if (!prefs) {
    return NextResponse.json({ error: "profile not found" }, { status: 404 });
  }

  // Meals del user (todos los días, todos los slots)
  const userMeals = MEALS.filter((m) => m.user === slug).map((m) => ({
    id: m.id,
    day: m.day,
    slot: m.slotName,
    name: m.name,
    ingredients: m.ingredients,
    prep: m.prepInstructions,
    kcal: m.kcal,
    proteinG: m.proteinG,
  }));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  // Prompt caching: cacheamos system + meals del user (estable hasta que
  // editen lib/data/meals.ts). Lo que NO se cachea es el bloque de prefs
  // — esa parte cambia en cada llamada.
  const stableMealsBlock = `MEALS ACTUALES (${userMeals.length}):
${JSON.stringify(userMeals, null, 2)}

Revisa cada meal. Para CADA UNA que rompa las reglas duras, devuélvela rewriteada. Las que cumplan, NO las incluyas en "changes".`;

  const volatilePrefsBlock = `PREFERENCIAS DEL USUARIO:
${JSON.stringify(prefs, null, 2)}`;

  let parsed: { changes: MealChange[] };
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4_000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: stableMealsBlock,
              cache_control: { type: "ephemeral" },
            },
            { type: "text", text: volatilePrefsBlock },
          ],
        },
      ],
    });

    const text =
      resp.content[0]?.type === "text" ? resp.content[0].text : "";
    // Claude a veces envuelve en ```json; quitarlo
    const clean = text.replace(/^```json\s*|\s*```$/g, "").trim();
    parsed = JSON.parse(clean);
  } catch (err) {
    console.error("[replan-meals] claude/parse error:", err);
    return NextResponse.json(
      { error: "claude failed", detail: String(err) },
      { status: 502 }
    );
  }

  const changes = Array.isArray(parsed.changes) ? parsed.changes : [];

  // Persiste en meal_replans (append-only)
  const profileUuid = await slugToUuid(slug);
  if (profileUuid && changes.length > 0) {
    const sb = getServerSupabase();
    await sb.from("meal_replans").insert({
      profile_id: profileUuid,
      triggered_by: triggeredBy,
      meals_changed: changes,
      prefs_snapshot: prefs,
    });
  }

  // WhatsApp notification (fire-and-forget) si el user opted-in.
  // Falla silencioso para no bloquear la response. Logging va a `wa_messages`.
  notifyReplanIfOptedIn(slug, profileUuid, changes, triggeredBy).catch((err) =>
    console.warn("[replan-meals] wa notify failed:", err)
  );

  return NextResponse.json({
    triggeredBy,
    mealsChanged: changes.length,
    changes,
  });
}

async function notifyReplanIfOptedIn(
  slug: "mike" | "andy",
  profileUuid: string | null,
  changes: MealChange[],
  triggeredBy: string
): Promise<void> {
  const settings = await getNotificationSettings(slug).catch(() => null);
  if (!settings?.whatsappOptIn || !settings.phoneE164) return;

  // Skip notification para reverts manuales (no agregan info útil)
  if (triggeredBy === "manual_revert") return;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://dovo.app";
  const body = buildReplanMessage({
    displayName: PROFILES[slug].displayName,
    changes,
    appBaseUrl: baseUrl,
    slug,
    triggeredBy,
  });

  if (!settings.callmebotApiKey) {
    // Opt-in incompleto: el user marcó WhatsApp pero no terminó el setup en
    // CallMeBot. Log silencioso para diagnóstico, sin romper el flow.
    console.warn(
      `[wa] ${slug} opted in pero falta callmebot_api_key — skipping notify`
    );
    return;
  }

  await sendWhatsApp(settings.phoneE164, body, {
    profileUuid: profileUuid ?? undefined,
    templateName: "replan_summary",
    apiKey: settings.callmebotApiKey,
  });
}
