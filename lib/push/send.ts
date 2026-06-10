import "server-only";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";
import type { NotificationPrefs } from "@/lib/actions/push";

// Envío server-side de Web Push (F8). FAIL-SOFT: sin VAPID keys en env es un no-op
// logueado — jamás rompe el action que lo invoca. Se llama "fire-and-forget" desde
// los flows (reto recibido, check-in del compañero, recompensa): cualquier error de
// push NUNCA debe fallar la operación principal.

let configured = false;

function ensureConfigured(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:hola@dovofit.com",
      pub,
      priv,
    );
    configured = true;
  }
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Manda un push a TODOS los devices de un user, respetando su preferencia `prefKey`.
 * Limpia suscripciones muertas (404/410 del push service).
 */
export async function sendPushToUser(
  userId: string,
  prefKey: keyof NotificationPrefs,
  payload: PushPayload,
): Promise<void> {
  try {
    if (!ensureConfigured()) return; // sin VAPID ⇒ push apagado (sandbox)

    const svc = createServiceClient();

    const { data: prefs, error: prefsErr } = await svc
      .schema("core")
      .from("notification_prefs")
      .select("racha_riesgo, reto, recompensa, checkin_companero")
      .eq("user_id", userId)
      .maybeSingle<NotificationPrefs>();
    if (prefsErr) {
      console.error("[push] prefs:", prefsErr.message);
      return;
    }
    // Sin row de prefs = defaults (todo on). Con row, respeta el toggle.
    if (prefs && !prefs[prefKey]) return;

    const { data: subs, error: subsErr } = await svc
      .schema("core")
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (subsErr) {
      console.error("[push] subs:", subsErr.message);
      return;
    }

    const body = JSON.stringify(payload);
    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            // Suscripción muerta: limpiar para no reintentar por siempre.
            const { error: delErr } = await svc
              .schema("core")
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", s.endpoint);
            if (delErr) console.error("[push] cleanup:", delErr.message);
          } else {
            console.error("[push] send:", err instanceof Error ? err.message : err);
          }
        }
      }),
    );
  } catch (err) {
    // Cinturón final: el push jamás tumba el flow que lo disparó.
    console.error("[push] sendPushToUser:", err instanceof Error ? err.message : err);
  }
}

/** Push a los co-miembros del trato (no al actor). Para "tu compañero entrenó" etc. */
export async function sendPushToComembers(
  tratoId: string,
  actorUserId: string,
  prefKey: keyof NotificationPrefs,
  payload: PushPayload,
): Promise<void> {
  try {
    if (!ensureConfigured()) return;
    const svc = createServiceClient();
    const { data: miembros, error } = await svc
      .schema("core")
      .from("trato_miembros")
      .select("user_id")
      .eq("trato_id", tratoId)
      .neq("user_id", actorUserId);
    if (error) {
      console.error("[push] comembers:", error.message);
      return;
    }
    await Promise.all(
      (miembros ?? []).map((m) => sendPushToUser(m.user_id as string, prefKey, payload)),
    );
  } catch (err) {
    console.error("[push] sendPushToComembers:", err instanceof Error ? err.message : err);
  }
}
