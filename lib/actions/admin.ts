"use server";

import { hoyCDMX } from "@/lib/workout/fecha";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";
import { logAppError } from "@/lib/observability/log";

export type AppError = {
  id: string;
  origen: string;
  mensaje: string;
  stack: string | null;
  url: string | null;
  resolved: boolean;
  created_at: string;
};

export type ScanFinding = { check: string; status: "ok" | "warn" | "critical"; detail: string };
export type ScanResult = { ok: boolean; findings: ScanFinding[]; scanned_at: string };

export type CronHealth = {
  jobname: string;
  schedule: string;
  active: boolean;
  last_status: string | null; // succeeded | failed | null (aún no corre)
  last_start: string | null;
  last_msg: string | null;
};

export type AdminData = {
  flags: Array<{ name: string; on: boolean }>;
  counts: Array<{ name: string; value: number }>;
  errors: AppError[];
  crons: CronHealth[];
  dbOk: boolean;
};

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return { ok: false };
  return { ok: true, userId: user.id };
}

export async function getAdminData(): Promise<AdminData | null> {
  const gate = await requireAdmin();
  if (!gate.ok) return null;

  const svc = createServiceClient();

  // Flags de entorno (solo on/off — jamás el valor).
  const flags = [
    { name: "billing (Stripe)", on: process.env.BILLING_ENABLED === "true" && !!process.env.STRIPE_SECRET_KEY },
    { name: "nutrición IA", on: process.env.NUTRITION_AI_LIVE === "true" && !!process.env.ANTHROPIC_API_KEY },
    { name: "body scan IA", on: process.env.BODY_SCAN_LIVE === "true" && !!process.env.ANTHROPIC_API_KEY },
    { name: "push (VAPID)", on: !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY },
    { name: "email (Resend)", on: !!process.env.RESEND_API_KEY },
  ];

  // Conteos de salud. Cada query checa error (regla del proyecto); un fallo marca dbOk=false.
  let dbOk = true;
  async function count(table: string): Promise<number> {
    const { count: c, error } = await svc
      .schema("core")
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      dbOk = false;
      console.error(`[admin] count ${table}:`, error.message);
      return -1;
    }
    return c ?? 0;
  }

  const [users, tratos, subs, scans] = await Promise.all([
    count("users"),
    count("tratos"),
    count("subscriptions"),
    count("body_scans"),
  ]);

  const base = new Date(hoyCDMX() + "T00:00:00Z");
  base.setUTCDate(base.getUTCDate() - 7);
  const hace7d = base.toISOString().slice(0, 10);
  const { count: checkins7d, error: chkErr } = await svc
    .schema("core")
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .gte("fecha", hace7d);
  if (chkErr) {
    dbOk = false;
    console.error("[admin] checkins:", chkErr.message);
  }

  const { data: errRows, error: errErr } = await svc
    .schema("core")
    .from("app_errors")
    .select("id, origen, mensaje, stack, url, resolved, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (errErr) {
    dbOk = false;
    console.error("[admin] app_errors:", errErr.message);
  }

  // Salud de los crons (Veredicto, cierre de duelos): un job caído en silencio
  // vuelve escenografía toda la UI que depende de él.
  const { data: cronRows, error: cronErr } = await svc
    .schema("core")
    .rpc("cron_health");
  if (cronErr) {
    dbOk = false;
    console.error("[admin] cron_health:", cronErr.message);
  }

  return {
    flags,
    counts: [
      { name: "usuarios", value: users },
      { name: "dúos", value: tratos },
      { name: "check-ins 7d", value: checkins7d ?? -1 },
      { name: "suscripciones", value: subs },
      { name: "body scans", value: scans },
    ],
    errors: (errRows ?? []) as AppError[],
    crons: (cronRows ?? []) as CronHealth[],
    dbOk,
  };
}

/** Auditoría interna (core.self_scan): RLS, definer expuestos, consistencia, errores. */
export async function runSelfScan(): Promise<Result<ScanResult>> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: "no autorizado" };

  const svc = createServiceClient();
  const { data, error } = await svc.schema("core").rpc("self_scan");
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ScanResult };
}

export async function markErrorResolved(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: "no autorizado" };
  const svc = createServiceClient();
  const { error } = await svc
    .schema("core")
    .from("app_errors")
    .update({ resolved: true })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

/**
 * Reporte desde el error boundary del cliente (cualquier user autenticado).
 * Va a core.app_errors vía service role (la tabla está cerrada al cliente).
 */
export async function reportClientError(input: {
  mensaje: string;
  stack?: string;
  url?: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Solo autenticados (anti-spam); el boundary público no reporta.
  if (!user) return;
  await logAppError({
    origen: "client-boundary",
    mensaje: input.mensaje,
    stack: input.stack,
    url: input.url,
    userId: user.id,
  });
}
