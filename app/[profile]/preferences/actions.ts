"use server";

import { revalidatePath } from "next/cache";
import { isProfileId } from "@/lib/profile";
import {
  updateDietaryProfile,
  updateNotificationSettings,
  slugToUuid,
} from "@/lib/profileServer";
import { getServerSupabase } from "@/lib/supabase";
import { sendWhatsApp } from "@/lib/whatsapp";
import { requireSlug } from "@/lib/auth/session";
import type { DietaryProfile, DietaryTag } from "@/lib/types";

const VALID_TAGS: DietaryTag[] = [
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "paleo",
  "no-gluten",
  "no-dairy",
  "no-eggs",
];

function csvToArray(input: FormDataEntryValue | null): string[] {
  if (typeof input !== "string") return [];
  return input
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

/**
 * Detecta contradicciones entre dietary_tags y liked_ingredients.
 * Modo "solo avisar": nunca bloquea; el form muestra warnings y el segundo
 * click guarda con `force_save=1`.
 */
export async function validatePrefsConflicts(
  prefs: DietaryProfile
): Promise<string[]> {
  const warnings: string[] = [];
  const likes = prefs.likedIngredients.map((s) => s.toLowerCase());
  const tags = new Set<DietaryTag>(prefs.dietaryTags);

  const flag = (tag: DietaryTag, forbidden: string[], label: string) => {
    if (!tags.has(tag)) return;
    const hits = likes.filter((l) => forbidden.some((f) => l.includes(f)));
    if (hits.length)
      warnings.push(`Dieta ${label} pero te gusta: ${hits.join(", ")}.`);
  };

  flag("vegan",      ["queso", "leche", "huevo", "miel", "carne", "pollo", "atún"], "vegana");
  flag("vegetarian", ["pollo", "carne", "atún", "pescado", "jamón"],                "vegetariana");
  flag("no-gluten",  ["pan", "harina", "seitán", "trigo", "galleta"],               "sin gluten");
  flag("no-dairy",   ["queso", "leche", "yogurt", "crema", "mantequilla"],          "sin lácteos");
  flag("no-eggs",    ["huevo", "mayonesa"],                                         "sin huevo");
  return warnings;
}

export async function savePreferences(
  slug: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; warnings: string[] }> {
  if (!isProfileId(slug)) return { ok: false, warnings: ["Perfil inválido"] };

  // Parse form
  const dietaryTags = (formData.getAll("dietary_tags") as string[]).filter(
    (t): t is DietaryTag => VALID_TAGS.includes(t as DietaryTag)
  );

  const patch: Partial<DietaryProfile> = {
    postalCode: (formData.get("postal_code") as string | null)?.trim() || undefined,
    dietaryTags,
    allergens: csvToArray(formData.get("allergens")),
    dislikedIngredients: csvToArray(formData.get("disliked_ingredients")),
    likedIngredients: csvToArray(formData.get("liked_ingredients")),
    dislikedTextures: csvToArray(formData.get("disliked_textures")),
    maxMealKcal: formData.get("max_meal_kcal")
      ? Number(formData.get("max_meal_kcal"))
      : undefined,
    notesForAi: ((formData.get("notes_for_ai") as string | null) ?? "").trim() || undefined,
  };

  const warnings = await validatePrefsConflicts(patch as DietaryProfile);
  const forceSave = formData.get("force_save") === "1";
  if (warnings.length > 0 && !forceSave) {
    return { ok: false, warnings };
  }

  await updateDietaryProfile(slug, patch);

  // Notification settings (WhatsApp opt-in + phone)
  const phoneRaw = (formData.get("phone_e164") as string | null)?.trim() ?? "";
  const phoneNormalized = phoneRaw.replace(/[^\d+]/g, "");
  const callmebotKey = (
    (formData.get("callmebot_api_key") as string | null) ?? ""
  )
    .trim()
    .replace(/\s+/g, "");
  await updateNotificationSettings(slug, {
    phoneE164: phoneNormalized || undefined,
    whatsappOptIn: formData.get("whatsapp_opt_in") === "on",
    callmebotApiKey: callmebotKey || undefined,
  });

  // Dispara AI re-plan async (fire-and-forget). Si falla, no rompe el guardado.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/replan-meals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.CRON_SECRET ?? "",
    },
    body: JSON.stringify({ slug, triggeredBy: "prefs_changed" }),
  }).catch((err) => {
    console.warn("[replan-meals] fire-and-forget failed:", err);
  });

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/preferences`);
  revalidatePath(`/${slug}/super`);
  return { ok: true };
}

/**
 * Forzar un re-plan AI ahora mismo, sin tocar prefs. Útil cuando el user
 * cambia ingredientes de la pantalla de meals manualmente o quiere
 * probar otra variante del plan.
 */
export async function triggerReplan(
  slug: string
): Promise<{ ok: boolean; changes?: number; error?: string }> {
  if (!isProfileId(slug)) return { ok: false, error: "Perfil inválido" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/replan-meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET ?? "",
      },
      body: JSON.stringify({ slug, triggeredBy: "manual" }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { mealsChanged?: number };
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/preferences`);
    revalidatePath(`/${slug}/semana`, "layout");
    return { ok: true, changes: json.mealsChanged ?? 0 };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Revertir al plan original: inserta una fila de meal_replans vacía con
 * `triggered_by='manual_revert'`. La lookup "más reciente" en mealsServer
 * verá un changes vacío y devolverá MEALS del seed sin overrides.
 */
export async function revertReplan(slug: string): Promise<{ ok: boolean }> {
  if (!isProfileId(slug)) return { ok: false };

  const uuid = await slugToUuid(slug);
  if (!uuid) return { ok: false };

  const sb = getServerSupabase();
  const { error } = await sb.from("meal_replans").insert({
    profile_id: uuid,
    triggered_by: "manual_revert",
    meals_changed: [],
    prefs_snapshot: {},
  });

  if (error) {
    console.warn("[revertReplan] error:", error.message);
    return { ok: false };
  }

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/preferences`);
  revalidatePath(`/${slug}/semana`, "layout");
  return { ok: true };
}

/**
 * Envía un WhatsApp de prueba a las credenciales guardadas del perfil.
 * Útil después de configurar phone + callmebot_api_key — el user verifica
 * que el setup funciona sin esperar al cron de las 7am.
 *
 * Trabaja sobre lo SAVED en DB, no sobre el form en pantalla. Por eso pide
 * guardar primero (botón disabled hasta que la key existe).
 */
export async function sendTestMessage(
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireSlug();

  if (!isProfileId(slug)) return { ok: false, error: "Perfil inválido" };

  const uuid = await slugToUuid(slug);
  if (!uuid) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("display_name, phone_e164, callmebot_api_key, whatsapp_opt_in")
    .eq("id", uuid)
    .single();

  if (error || !data) return { ok: false, error: "No pude leer el perfil" };

  const phone = data.phone_e164 as string | null;
  const apiKey = data.callmebot_api_key as string | null;
  const optIn = data.whatsapp_opt_in as boolean | null;
  const displayName = (data.display_name as string) || "";

  if (!phone || !apiKey) {
    return {
      ok: false,
      error: "Falta teléfono o API key. Guarda primero, luego prueba.",
    };
  }
  if (!optIn) {
    return {
      ok: false,
      error: "WhatsApp está apagado. Activa el opt-in y guarda.",
    };
  }

  const text =
    `🧪 dovo · test\n\n` +
    `${displayName}, si ves esto tu setup funciona. ` +
    `Los nudges automáticos llegan a partir de mañana 7am MX.`;

  const res = await sendWhatsApp(phone, text, {
    profileUuid: uuid,
    templateName: "test_manual",
    apiKey,
  });

  return res.ok ? { ok: true } : { ok: false, error: res.error ?? "Envío falló" };
}
