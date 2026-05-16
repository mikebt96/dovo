import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MEALS } from "@/lib/data/meals";
import { isProfileId } from "@/lib/profile";
import { getDietaryProfile, slugToUuid } from "@/lib/profileServer";
import { getServerSupabase } from "@/lib/supabase";
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
      "reason": "Sustituí panela y huevo (no-dairy + no-eggs). Mantuve kcal ±10%."
    }
  ]
}

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

  const userMessage = `PREFERENCIAS DEL USUARIO:
${JSON.stringify(prefs, null, 2)}

MEALS ACTUALES (${userMeals.length}):
${JSON.stringify(userMeals, null, 2)}

Revisa cada meal. Para CADA UNA que rompa las reglas duras, devuélvela rewriteada. Las que cumplan, NO las incluyas en "changes".`;

  let parsed: { changes: MealChange[] };
  try {
    // NOTE: prompt caching disabled — SDK v0.32.1 no expone `cache_control` en
    // types. Cuando upgradeemos a ^0.40, agregar `cache_control: { type: "ephemeral" }`
    // al system block para ahorrar ~80% en tokens repetidos.
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4_000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
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

  return NextResponse.json({
    triggeredBy,
    mealsChanged: changes.length,
    changes,
  });
}
