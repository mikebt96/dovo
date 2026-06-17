"use server";

import { hoyCDMX } from "@/lib/workout/fecha";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";
import { logAppError } from "@/lib/observability/log";
import {
  clasificarPremio,
  LABEL_CATEGORIA,
  type CategoriaPremio,
} from "@/lib/analytics/premios";
import type { ApuestaRow } from "@/lib/actions/apuestas";

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
    { name: "strava", on: !!process.env.STRAVA_CLIENT_ID && !!process.env.STRAVA_CLIENT_SECRET },
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

// ── Inteligencia de premios (mandato 2026-06-12): qué se juegan los dúos,
// agregado y anónimo — el activo para negociar descuentos con marcas. ──

export type PremioCategoriaAgg = {
  categoria: CategoriaPremio;
  label: string;
  selladas: number; // apuestas selladas con premio de esta categoría
  vivas: number; // semana en curso, aún sin Veredicto — no cuentan al %
  ganadas: number; // el dúo cumplió la semana: el premio se disfrutó
  duos: number; // dúos únicos que apostaron esto
};

export type InteligenciaPremios = {
  categorias: PremioCategoriaAgg[]; // orden: más selladas primero
  totales: {
    selladas: number;
    vivas: number;
    ganadas: number;
    duos: number; // dúos únicos en el agregado
    excluidosOptOut: number; // dúos fuera por opt-out de pulse (transparencia)
  };
};

// PostgREST capa TODA respuesta a max_rows (1000 en config.toml) sin marcar
// error — un .limit(5000) devuelve 1000 en silencio. Por eso se pagina con
// .range(); al tope, "fallar" aborta (gates de privacidad: fail-closed) y
// "avisar" entrega agregado parcial con warn.
const PAGINA = 1000;
async function paginar<T>(
  etiqueta: string,
  maxFilas: number,
  alTope: "fallar" | "avisar",
  query: (desde: number, hasta: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[] | null> {
  const filas: T[] = [];
  for (let desde = 0; desde < maxFilas; desde += PAGINA) {
    const { data, error } = await query(desde, Math.min(desde + PAGINA, maxFilas) - 1);
    if (error) {
      console.error(`[admin] inteligencia ${etiqueta}:`, error.message);
      return null;
    }
    const lote = data ?? [];
    filas.push(...lote);
    if (lote.length < PAGINA) return filas; // última página real
  }
  if (alTope === "fallar") {
    console.error(`[admin] inteligencia ${etiqueta}: >${maxFilas} filas — abortando (fail-closed)`);
    return null;
  }
  console.warn(`[admin] inteligencia ${etiqueta}: tope de ${maxFilas} filas — agregado parcial`);
  return filas;
}

export async function getInteligenciaPremios(): Promise<InteligenciaPremios | null> {
  const gate = await requireAdmin();
  if (!gate.ok) return null;

  const svc = createServiceClient();

  // Regla conservadora: si CUALQUIER miembro del dúo se salió de pulse, el
  // dúo ENTERO queda fuera del agregado — y el flag es PEGAJOSO a nivel
  // trato (tratos.pulse_excluido, triggers en F24): aunque el miembro se
  // vaya o borre su cuenta, el histórico del trato no reingresa jamás.
  // Gate fail-closed: truncado silencioso = abortar.
  const excluidos = await paginar<{ id: string }>("tratos excluidos", 50_000, "fallar", (d, h) =>
    svc
      .schema("core")
      .from("tratos")
      .select("id")
      .eq("pulse_excluido", true)
      .order("id")
      .range(d, h),
  );
  if (!excluidos) return null;
  const tratosExcluidos = new Set(excluidos.map((r) => r.id));

  // Apuestas más recientes primero; si algún día rebasan el tope, el agregado
  // es parcial CON aviso (jamás silencioso).
  const rows = await paginar<Pick<ApuestaRow, "trato_id" | "premio_text" | "estado">>(
    "apuestas",
    5000,
    "avisar",
    (d, h) =>
      svc
        .schema("core")
        .from("apuestas")
        .select("trato_id, premio_text, estado")
        .order("created_at", { ascending: false })
        .order("id")
        .range(d, h),
  );
  if (!rows) return null;

  const porCategoria = new Map<
    CategoriaPremio,
    { selladas: number; vivas: number; ganadas: number; duos: Set<string> }
  >();
  const duosIncluidos = new Set<string>();
  const duosFuera = new Set<string>();

  for (const r of rows) {
    if (tratosExcluidos.has(r.trato_id)) {
      duosFuera.add(r.trato_id);
      continue;
    }
    duosIncluidos.add(r.trato_id);
    const cat = clasificarPremio(r.premio_text);
    const agg =
      porCategoria.get(cat) ?? { selladas: 0, vivas: 0, ganadas: 0, duos: new Set<string>() };
    agg.selladas += 1;
    if (r.estado === "viva") agg.vivas += 1;
    if (r.estado === "ganada") agg.ganadas += 1;
    agg.duos.add(r.trato_id);
    porCategoria.set(cat, agg);
  }

  const categorias: PremioCategoriaAgg[] = [...porCategoria.entries()]
    .map(([categoria, a]) => ({
      categoria,
      label: LABEL_CATEGORIA[categoria],
      selladas: a.selladas,
      vivas: a.vivas,
      ganadas: a.ganadas,
      duos: a.duos.size,
    }))
    .sort((a, b) => b.selladas - a.selladas);

  return {
    categorias,
    totales: {
      selladas: categorias.reduce((s, c) => s + c.selladas, 0),
      vivas: categorias.reduce((s, c) => s + c.vivas, 0),
      ganadas: categorias.reduce((s, c) => s + c.ganadas, 0),
      duos: duosIncluidos.size,
      excluidosOptOut: duosFuera.size,
    },
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
