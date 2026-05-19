// Edge function: ingest-pulse-event
// Recibe POST con dimensions ya bucketed de un trato cerrado.
// Gates: si CUALQUIERA del dúo tiene pulse_opt_out=true, omite el evento.
// Inserta a pulse.eventos_agregados (schema separado, RLS sin policies = solo
// accesible vía service_role, que esta función usa).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://esm.sh/zod@4.4.3";

const PulseEventSchema = z.object({
  // IDs del dúo para chequear opt-out. NUNCA se persisten en pulse.
  creator_id: z.string().uuid(),
  partner_id: z.string().uuid(),
  // Dimensions bucketed
  categoria: z.string().min(1).max(50),
  duracion_dias_bucket: z.string().min(1).max(20),
  tasa_cumplimiento_bucket: z.string().min(1).max(20),
  cohorte_edad: z.string().optional().default("unknown"),
  cohorte_ciudad: z.string().optional().default("unknown"),
  es_patrocinado: z.boolean(),
  dow_creacion: z.number().int().min(0).max(6),
});

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const parsed = PulseEventSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "invalid body", issues: parsed.error.issues }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[pulse] missing SUPABASE_URL or SERVICE_ROLE_KEY");
    return json({ error: "server misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Opt-out gate: si CUALQUIERA del dúo tiene pulse_opt_out=true, omitir.
  // Mantiene la promesa al user: si yo opto out, mi trato no contribuye
  // a estadísticas aunque mi pareja sí participe.
  const { data: members, error: lookupErr } = await admin
    .schema("core")
    .from("users")
    .select("id, pulse_opt_out")
    .in("id", [parsed.data.creator_id, parsed.data.partner_id]);

  if (lookupErr) {
    console.error("[pulse] lookup failed:", lookupErr.message);
    return json({ error: "lookup failed" }, 500);
  }

  if (!members || members.length < 2) {
    // Caso raro: uno de los dos no existe en core.users. Mejor omitir.
    return json({ skipped: true, reason: "members_not_found" }, 200);
  }

  const anyOptOut = members.some((m) => m.pulse_opt_out === true);
  if (anyOptOut) {
    return json({ skipped: true, reason: "opt_out" }, 200);
  }

  const { error: insertErr } = await admin
    .schema("pulse")
    .from("eventos_agregados")
    .insert({
      categoria: parsed.data.categoria,
      duracion_dias_bucket: parsed.data.duracion_dias_bucket,
      tasa_cumplimiento_bucket: parsed.data.tasa_cumplimiento_bucket,
      cohorte_edad: parsed.data.cohorte_edad,
      cohorte_ciudad: parsed.data.cohorte_ciudad,
      es_patrocinado: parsed.data.es_patrocinado,
      dow_creacion: parsed.data.dow_creacion,
    });

  if (insertErr) {
    console.error("[pulse] insert failed:", insertErr.message);
    return json({ error: insertErr.message }, 500);
  }

  return json({ ok: true }, 200);
});
