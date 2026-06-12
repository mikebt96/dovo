"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NotificationPrefs = {
  racha_riesgo: boolean;
  reto: boolean;
  recompensa: boolean;
  checkin_companero: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  racha_riesgo: true,
  reto: true,
  recompensa: true,
  checkin_companero: true,
};

/** La public VAPID key que el browser necesita para suscribirse (null = push apagado). */
export async function getVapidPublicKey(): Promise<string | null> {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<Result> {
  if (!input.endpoint.startsWith("https://")) return { ok: false, error: "endpoint inválido" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error } = await supabase
    .schema("core")
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth },
      { onConflict: "endpoint" },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function removePushSubscription(endpoint: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("core")
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PREFS;
  const { data, error } = await supabase
    .schema("core")
    .from("notification_prefs")
    .select("racha_riesgo, reto, recompensa, checkin_companero")
    .eq("user_id", user.id)
    .maybeSingle<NotificationPrefs>();
  if (error) console.error("[push] prefs read:", error.message);
  return data ?? DEFAULT_PREFS;
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error } = await supabase
    .schema("core")
    .from("notification_prefs")
    .upsert(
      {
        user_id: user.id,
        racha_riesgo: !!prefs.racha_riesgo,
        reto: !!prefs.reto,
        recompensa: !!prefs.recompensa,
        checkin_companero: !!prefs.checkin_companero,
      },
      { onConflict: "user_id" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ajustes");
  return { ok: true, data: undefined };
}
