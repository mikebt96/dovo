import { NextResponse } from "next/server";
import { closingNudge } from "@/lib/whatsapp/nudges";
import type { ProfileId } from "@/lib/types";

/**
 * Closing nudge — 21:00 MX (UTC-6) = 03:00 UTC del día siguiente.
 * Schedule: `0 3 * * *` en vercel.json.
 *
 * Coincide en horario con el weekly-review (lunes 03:00 UTC). Son
 * endpoints separados; corren en paralelo sin colisionar (cada uno
 * tiene su lambda).
 *
 * Mensaje varía según estado del día:
 *  - 0/N marcado: "aún hay tiempo, racha en riesgo"
 *  - parcial: "te faltan X para cerrar"
 *  - completo: "🟢 día cerrado, +XP"
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROFILES: ProfileId[] = ["mike", "andy"];

async function handle(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await Promise.all(PROFILES.map((s) => closingNudge(s)));
  return NextResponse.json({ ran_at: new Date().toISOString(), results });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
