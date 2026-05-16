import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { sendWhatsApp } from "@/lib/whatsapp";
import { getMealsFor } from "@/lib/data/meals";
import { getDay } from "@/lib/data/days";
import { dayKeyOf, parseISODate, todayISO } from "@/lib/dates";
import type { ProfileId } from "@/lib/types";

/**
 * Lógica de nudges WhatsApp. Una función pública por horario.
 * Cada nudge:
 *   1. Lee profile (phone, api_key, opt_in).
 *   2. Si falta cualquier credencial → skip silencioso (no es error).
 *   3. Construye texto contextual según estado del día.
 *   4. Envía vía sendWhatsApp (que persiste en wa_messages).
 *
 * Diseño deliberado: NO usamos templates Meta. CallMeBot acepta texto libre,
 * sin ventana 24h ni aprobaciones. Texto en español mexicano, ≤300 chars
 * (cabe en notificación lockscreen iOS/Android sin truncado).
 */

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://dovo.app";
const PARTNER_OF: Record<ProfileId, ProfileId> = { mike: "andy", andy: "mike" };

type ProfileRow = {
  display_name: string;
  phone_e164: string | null;
  whatsapp_opt_in: boolean | null;
  callmebot_api_key: string | null;
};

async function loadProfile(slug: ProfileId): Promise<
  | (ProfileRow & { id: string; partner_streak: number; my_streak: number })
  | null
> {
  const sb = getServerSupabase();
  const id = await slugToUuid(slug);
  if (!id) return null;

  const partnerSlug = PARTNER_OF[slug];
  const partnerUuid = await slugToUuid(partnerSlug);

  const [p, myStreak, partnerStreak] = await Promise.all([
    sb
      .from("profiles")
      .select("display_name, phone_e164, whatsapp_opt_in, callmebot_api_key")
      .eq("id", id)
      .single(),
    sb.from("streaks").select("current").eq("profile_id", id).maybeSingle(),
    partnerUuid
      ? sb
          .from("streaks")
          .select("current")
          .eq("profile_id", partnerUuid)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (p.error || !p.data) return null;
  return {
    id,
    display_name: p.data.display_name as string,
    phone_e164: p.data.phone_e164 as string | null,
    whatsapp_opt_in: p.data.whatsapp_opt_in as boolean | null,
    callmebot_api_key: p.data.callmebot_api_key as string | null,
    my_streak: (myStreak.data?.current as number | undefined) ?? 0,
    partner_streak: (partnerStreak.data?.current as number | undefined) ?? 0,
  };
}

type NudgeResult =
  | { sent: true; slug: ProfileId }
  | { sent: false; slug: ProfileId; reason: string };

function skip(slug: ProfileId, reason: string): NudgeResult {
  return { sent: false, slug, reason };
}

/* ------------------------------------------------------------------ */
/*  Morning nudge — 7:00 MX                                            */
/* ------------------------------------------------------------------ */

export async function morningNudge(slug: ProfileId): Promise<NudgeResult> {
  const profile = await loadProfile(slug);
  if (!profile) return skip(slug, "profile not found");
  if (!profile.whatsapp_opt_in) return skip(slug, "opt-out");
  if (!profile.phone_e164 || !profile.callmebot_api_key) {
    return skip(slug, "missing phone or api_key");
  }

  const today = todayISO();
  const dayKey = dayKeyOf(parseISODate(today));
  const day = getDay(dayKey);
  if (!day) return skip(slug, "no day plan");

  const myMeals = getMealsFor(slug, dayKey);
  const text = buildMorningText({
    name: profile.display_name,
    dayLabel: day.label.toLowerCase(),
    focus: day.focus,
    mealsCount: myMeals.length,
    myStreak: profile.my_streak,
    partnerStreak: profile.partner_streak,
    partnerName: profile.display_name === "Mike" ? "Andy" : "Mike",
    url: `${APP_URL()}/${slug}`,
  });

  const res = await sendWhatsApp(profile.phone_e164, text, {
    profileUuid: profile.id,
    templateName: "nudge_morning",
    apiKey: profile.callmebot_api_key,
  });

  return res.ok ? { sent: true, slug } : skip(slug, res.error ?? "send failed");
}

function buildMorningText(p: {
  name: string;
  dayLabel: string;
  focus: string;
  mealsCount: number;
  myStreak: number;
  partnerStreak: number;
  partnerName: string;
  url: string;
}): string {
  const streakLine =
    p.myStreak === 0
      ? "Racha en 0 — hoy es día 1."
      : p.myStreak >= 7
        ? `🔥 Racha ${p.myStreak}d — no la sueltes.`
        : `Racha ${p.myStreak}d.`;

  const partnerLine =
    p.partnerStreak > p.myStreak
      ? `${p.partnerName} va en ${p.partnerStreak}d. Alcánzalo.`
      : p.partnerStreak === p.myStreak && p.myStreak > 0
        ? `${p.partnerName} va igual que tú.`
        : "";

  return [
    `${p.name}, ${p.dayLabel}.`,
    p.focus,
    `${p.mealsCount} comidas planeadas.`,
    streakLine,
    partnerLine,
    p.url,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/*  Closing nudge — 21:00 MX                                           */
/* ------------------------------------------------------------------ */

export async function closingNudge(slug: ProfileId): Promise<NudgeResult> {
  const profile = await loadProfile(slug);
  if (!profile) return skip(slug, "profile not found");
  if (!profile.whatsapp_opt_in) return skip(slug, "opt-out");
  if (!profile.phone_e164 || !profile.callmebot_api_key) {
    return skip(slug, "missing phone or api_key");
  }

  const today = todayISO();
  const dayKey = dayKeyOf(parseISODate(today));
  const planned = getMealsFor(slug, dayKey).length;
  if (planned === 0) return skip(slug, "no meals planned today");

  // Cuántas meals marcadas hoy
  const sb = getServerSupabase();
  const { data: logged } = await sb
    .from("meals_log")
    .select("meal_id")
    .eq("profile_id", profile.id)
    .eq("date", today)
    .eq("completed", true);
  const completed = logged?.length ?? 0;
  const remaining = Math.max(0, planned - completed);

  const text = buildClosingText({
    name: profile.display_name,
    completed,
    planned,
    remaining,
    myStreak: profile.my_streak,
    url: `${APP_URL()}/${slug}/semana/${dayKey}`,
  });

  const res = await sendWhatsApp(profile.phone_e164, text, {
    profileUuid: profile.id,
    templateName: "nudge_closing",
    apiKey: profile.callmebot_api_key,
  });

  return res.ok ? { sent: true, slug } : skip(slug, res.error ?? "send failed");
}

function buildClosingText(p: {
  name: string;
  completed: number;
  planned: number;
  remaining: number;
  myStreak: number;
  url: string;
}): string {
  if (p.remaining === 0) {
    // Día completo
    return [
      `🟢 ${p.name} — día completo.`,
      `+50 XP y +10 coins. Racha ahora en ${p.myStreak + 1}d (cerrando hoy).`,
      p.url,
    ].join("\n");
  }

  if (p.completed === 0) {
    return [
      `${p.name} — 0/${p.planned} comidas. Aún hay tiempo.`,
      p.myStreak > 0
        ? `Si dejas el día en 0, rompes tu racha de ${p.myStreak}d.`
        : "Hoy es el primer día.",
      p.url,
    ].join("\n");
  }

  const closingLine =
    p.remaining === 1
      ? `1 sola comida para cerrar.`
      : `Te faltan ${p.remaining} de ${p.planned}.`;

  return [
    `${p.name} — ${p.completed}/${p.planned} comidas.`,
    closingLine,
    p.myStreak > 0
      ? `Cerrar = +XP +coins, mantienes racha de ${p.myStreak}d → ${p.myStreak + 1}d.`
      : "Cerrar = +XP +coins, racha empieza.",
    p.url,
  ].join("\n");
}
