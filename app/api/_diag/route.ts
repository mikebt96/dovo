import { NextResponse } from "next/server";

/**
 * Endpoint de diagnóstico — solo accesible con CRON_SECRET.
 *
 * Devuelve qué env vars están presentes (sin valores). Útil para verificar
 * configuración de Vercel sin tener que revisar el dashboard. Ejemplo:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://dovo.vercel.app/api/_diag
 *
 * NUNCA expone valores reales, solo nombres + un hash truncado para
 * detectar cambios sin revelar secrets.
 */
export const dynamic = "force-dynamic";

const TRACKED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "CRON_SECRET",
  "SECRET_LINK_SLUG",
  "APP_PIN",
  "NEXT_PUBLIC_APP_URL",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_VERIFY_TOKEN",
  "NODE_ENV",
  "VERCEL_ENV",
] as const;

function shortHash(s: string): string {
  // Hash determinístico de 6 chars. Suficiente para detectar "cambió o no".
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 6);
}

async function handle(req: Request) {
  // En dev (sin CRON_SECRET en env), permitimos sin auth para diagnóstico local.
  const required = process.env.CRON_SECRET;
  if (required) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${required}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const report = TRACKED.map((name) => {
    const value = process.env[name];
    if (value === undefined || value === "") {
      return { name, present: false, length: 0, hash: null };
    }
    return {
      name,
      present: true,
      length: value.length,
      hash: shortHash(value),
    };
  });

  // Resumen rápido
  const missing = report
    .filter((r) => !r.present && !["NODE_ENV", "VERCEL_ENV"].includes(r.name))
    .map((r) => r.name);

  return NextResponse.json({
    runtime: {
      node: process.version,
      vercel_env: process.env.VERCEL_ENV ?? null,
      vercel_region: process.env.VERCEL_REGION ?? null,
    },
    missing_required: missing.filter((n) =>
      ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SECRET_LINK_SLUG"].includes(n),
    ),
    report,
  });
}

export async function GET(req: Request) {
  return handle(req);
}
