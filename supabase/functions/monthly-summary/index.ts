// Edge function: monthly-summary
// Invocada por pg_cron el día 1 de cada mes. Llama core.resumen_mensual(mes),
// arma un email por miembro de cada dúo activo y lo manda vía Resend.
// Fail-soft: sin RESEND_API_KEY, omite el envío (cuenta como skipped).
// Auth: requiere header x-cron-secret == CRON_SECRET (si está configurado).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type Resumen = {
  user_id: string;
  email: string;
  nombre: string;
  trato_id: string;
  nombre_grupo: string;
  checkins_mes: number;
  puntos_mes: number;
  racha_duo: number;
  fue: number; res: number; flex: number; vel: number; equ: number; vit: number;
};

// nivel = ⌊√(xp/50)⌋+1, xp = suma de stats (igual que lib/leveling, fórmula simple).
function nivel(r: Resumen): number {
  const xp = Number(r.fue) + Number(r.res) + Number(r.flex) + Number(r.vel) + Number(r.equ) + Number(r.vit);
  return xp > 0 ? Math.floor(Math.sqrt(xp / 50)) + 1 : 1;
}

function mesLargo(mesISO: string): string {
  const d = new Date(mesISO + "T00:00:00Z");
  return d.toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });
}

function emailHtml(r: Resumen, mesISO: string): string {
  const lvl = nivel(r);
  const stat = (label: string, v: number) =>
    `<td style="padding:6px 14px 6px 0;font:600 13px/1 ui-monospace,monospace;color:#6d4aff">${label} <span style="color:#08070d">${Math.round(Number(v))}</span></td>`;
  return `<!doctype html><html><body style="margin:0;background:#f4f4f6;font-family:Geist,-apple-system,sans-serif;color:#08070d">
<div style="max-width:520px;margin:0 auto;padding:48px 28px">
  <p style="font:700 22px/1 Syne,sans-serif;letter-spacing:-.02em;margin:0 0 32px">dovo</p>
  <p style="font:11px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#6d4aff;margin:0 0 8px">tu mes · ${mesLargo(mesISO)}</p>
  <h1 style="font:800 clamp(28px,7vw,40px)/.95 Geist,sans-serif;letter-spacing:-.04em;margin:0 0 20px">Hola, ${r.nombre}.</h1>
  <p style="font-size:16px;line-height:1.5;color:#2c2b36;margin:0 0 28px">
    Este mes con <strong>${r.nombre_grupo}</strong> registraste
    <strong>${r.checkins_mes}</strong> ${r.checkins_mes === 1 ? "sesión" : "sesiones"} y sumaste
    <strong>${Math.round(Number(r.puntos_mes))}</strong> puntos.
    Su racha va en <strong>${r.racha_duo}</strong> ${r.racha_duo === 1 ? "semana" : "semanas"}. Eres nivel <strong>${lvl}</strong>.
  </p>
  <table style="border-top:1px solid rgba(8,7,13,.12);padding-top:16px;width:100%"><tr>
    ${stat("FUE", r.fue)}${stat("RES", r.res)}${stat("FLE", r.flex)}
  </tr><tr>
    ${stat("VEL", r.vel)}${stat("EQU", r.equ)}${stat("VIT", r.vit)}
  </tr></table>
  <a href="https://dovofit.com" style="display:inline-block;margin-top:32px;background:#08070d;color:#f4f4f6;text-decoration:none;padding:12px 22px;border-radius:999px;font:600 14px Geist,sans-serif">Sigue tu racha →</a>
  <p style="font:11px/1.5 ui-monospace,monospace;color:rgba(8,7,13,.4);margin-top:40px">hecho para dos · dovofit.com</p>
</div></body></html>`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return json({ error: "unauthorized" }, 401);
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  // mes = primer día del mes a resumir; default = mes anterior al actual (UTC).
  let mes = typeof body.mes === "string" ? body.mes : "";
  if (!mes) {
    const n = new Date();
    mes = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await supabase.schema("core").rpc("resumen_mensual", { p_mes_inicio: mes });
  if (error) return json({ error: error.message }, 500);

  const rows = (data ?? []) as Resumen[];
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "dovo <hola@dovofit.com>";

  let sent = 0, skipped = 0, failed = 0;
  for (const r of rows) {
    if (!resendKey) { skipped++; continue; }
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: r.email,
          reply_to: "hola@dovofit.com",
          subject: `Tu mes en dovo — ${r.racha_duo} ${r.racha_duo === 1 ? "semana" : "semanas"} con ${r.nombre_grupo}`,
          html: emailHtml(r, mes),
        }),
      });
      if (res.ok) sent++; else failed++;
    } catch (_e) {
      failed++;
    }
  }
  return json({ ok: true, mes, total: rows.length, sent, skipped, failed });
});
