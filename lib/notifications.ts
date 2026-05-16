import type { MealChange } from "./types";
import type { WeekConsumption } from "./historyServer";

/**
 * Formateo de mensajes WhatsApp. Aislado del cliente HTTP para que sea
 * fácil de testear y de iterar el copy sin tocar el transporte.
 *
 * Convención: mensajes cortos (<1024 chars idealmente), 1 emoji máximo,
 * preview del impact + CTA a la app.
 */

export interface ReplanNotificationParams {
  displayName: string;          // "Mike" | "Andy"
  changes: MealChange[];
  appBaseUrl: string;            // ej. "https://dovo.app"
  slug: string;                  // "mike" | "andy"
  triggeredBy: string;
}

export function buildReplanMessage(p: ReplanNotificationParams): string {
  const { displayName, changes, appBaseUrl, slug, triggeredBy } = p;

  if (changes.length === 0) {
    return (
      `🤖 ${displayName}, revisé tu plan y todo está alineado con tus prefs.` +
      `\n\nSin cambios necesarios.`
    );
  }

  const count = changes.length;
  const preview = changes
    .slice(0, 3)
    .map((c) => `· ${c.newName}`)
    .join("\n");
  const more = count > 3 ? `\n· y ${count - 3} más…` : "";

  const triggerLine =
    triggeredBy === "manual"
      ? "Re-plan manual."
      : "Tus prefs cambiaron y rediseñé tus comidas:";

  return (
    `🤖 ${displayName}, ${triggerLine}\n\n` +
    `${preview}${more}\n\n` +
    `Ver detalles → ${appBaseUrl}/${slug}/preferences`
  );
}

export interface WeeklySummaryParams {
  displayName: string;
  consumption: WeekConsumption;
  planKcalWeek: number;            // target del seed para esa semana
  partnerName?: string;
  partnerKcal?: number;            // para "Mike va al 92%, Andy al 78%"
  partnerPlanKcal?: number;
  appBaseUrl: string;
  slug: string;
}

/**
 * Mensaje del domingo 8pm: "Llevas X kcal, Y% del plan, Z comidas".
 * Si hay datos del partner, incluye comparación de pareja (motivación social).
 * Mensaje silencioso si no hay nada loggeado — no se manda.
 */
export function buildWeeklySummaryMessage(
  p: WeeklySummaryParams
): string | null {
  const {
    displayName,
    consumption,
    planKcalWeek,
    partnerName,
    partnerKcal,
    partnerPlanKcal,
    appBaseUrl,
    slug,
  } = p;

  if (consumption.mealsLogged === 0) return null;

  const pct =
    planKcalWeek > 0
      ? Math.round((consumption.kcalReal / planKcalWeek) * 100)
      : 0;

  const status =
    pct >= 90 ? "🔥 buen ritmo"
    : pct >= 70 ? "💪 vas firme"
    : pct >= 50 ? "👀 a medias"
    : "🌱 apenas arrancas";

  const lines = [
    `📊 ${displayName}, cierre de semana:`,
    ``,
    `${consumption.kcalReal} kcal reales · ${pct}% del plan`,
    `${consumption.proteinReal}g proteína · ${consumption.mealsLogged} comidas marcadas`,
    `${status}`,
  ];

  if (
    partnerName &&
    typeof partnerKcal === "number" &&
    typeof partnerPlanKcal === "number" &&
    partnerPlanKcal > 0
  ) {
    const partnerPct = Math.round((partnerKcal / partnerPlanKcal) * 100);
    lines.push(``, `vs ${partnerName}: ${partnerPct}% del plan`);
  }

  lines.push(``, `Ver detalles → ${appBaseUrl}/${slug}/semana`);
  return lines.join("\n");
}
