import { NextResponse } from "next/server";
import { morningNudge } from "@/lib/whatsapp/nudges";
import type { ProfileId } from "@/lib/types";

/**
 * Morning nudge — 7:00 MX (UTC-6) = 13:00 UTC.
 * Schedule: `0 13 * * *` en vercel.json.
 *
 * Para cada profile que tiene phone_e164 + callmebot_api_key + opt_in,
 * envía un mensaje con plan del día + estado de racha.
 *
 * Profiles sin credenciales → skip silencioso. No error.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROFILES: ProfileId[] = ["mike", "andy"];

async function handle(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await Promise.all(PROFILES.map((s) => morningNudge(s)));
  return NextResponse.json({ ran_at: new Date().toISOString(), results });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
