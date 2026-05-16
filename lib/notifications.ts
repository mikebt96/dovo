import type { MealChange } from "./types";

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
