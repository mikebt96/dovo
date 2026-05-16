import { NextResponse } from "next/server";
import { PROFILES, isProfileId } from "@/lib/profile";
import { getNotificationSettings, slugToUuid } from "@/lib/profileServer";
import { getWeekConsumption } from "@/lib/historyServer";
import { getDayMacros } from "@/lib/data/meals";
import { sendWhatsApp } from "@/lib/whatsapp";
import { buildWeeklySummaryMessage } from "@/lib/notifications";
import { DAYS } from "@/lib/data/days";
import type { ProfileId } from "@/lib/types";

/**
 * Cron: domingos 8pm CDMX (= lunes 02:00 UTC). Manda resumen WhatsApp a
 * cada profile con opt-in. Incluye comparación con el partner si ambos
 * tienen datos.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}` (Vercel cron lo manda auto).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dovo.app";
  const slugs: ProfileId[] = ["mike", "andy"];

  // Pre-cargo el consumo de ambos para tener data del partner en el mensaje
  const data = await Promise.all(
    slugs.map(async (slug) => ({
      slug,
      consumption: await getWeekConsumption(slug).catch(() => null),
      planKcalWeek: DAYS.reduce(
        (sum, d) => sum + getDayMacros(slug, d.key).kcal,
        0,
      ),
      settings: await getNotificationSettings(slug).catch(() => null),
    })),
  );

  const summary: Record<string, { sent: boolean; reason?: string }> = {};

  for (const me of data) {
    if (!isProfileId(me.slug)) continue;

    if (!me.settings?.whatsappOptIn) {
      summary[me.slug] = { sent: false, reason: "opt-out" };
      continue;
    }
    if (!me.settings.phoneE164 || !me.settings.callmebotApiKey) {
      summary[me.slug] = { sent: false, reason: "setup-incomplete" };
      continue;
    }
    if (!me.consumption) {
      summary[me.slug] = { sent: false, reason: "no-consumption-data" };
      continue;
    }

    const partner = data.find((d) => d.slug !== me.slug);
    const message = buildWeeklySummaryMessage({
      displayName: PROFILES[me.slug].displayName,
      consumption: me.consumption,
      planKcalWeek: me.planKcalWeek,
      partnerName: partner ? PROFILES[partner.slug].displayName : undefined,
      partnerKcal: partner?.consumption?.kcalReal,
      partnerPlanKcal: partner?.planKcalWeek,
      appBaseUrl: baseUrl,
      slug: me.slug,
    });

    if (!message) {
      summary[me.slug] = { sent: false, reason: "no-meals-this-week" };
      continue;
    }

    const profileUuid = await slugToUuid(me.slug);
    const result = await sendWhatsApp(me.settings.phoneE164, message, {
      profileUuid: profileUuid ?? undefined,
      templateName: "weekly_summary",
      apiKey: me.settings.callmebotApiKey,
    });
    summary[me.slug] = result.ok
      ? { sent: true }
      : { sent: false, reason: result.error };
  }

  return NextResponse.json({ summary });
}
