import { NextResponse } from "next/server";
import { resolveStreakAtMidnight } from "@/lib/gamification/debts";
import type { ProfileId } from "@/lib/types";

/**
 * Cron: medianoche MX → resuelve streak break para ambos profiles.
 *
 * Schedule (vercel.json): `0 6 * * *` → 06:00 UTC = 00:00 MX (UTC-6).
 *
 * Para cada profile:
 *  - Si last_active_date >= ayer → no-op (streak viva).
 *  - Si hay gap y queda freeze → consume freeze.
 *  - Si hay gap y NO queda freeze → reset current=0 + crea pair_debt
 *    con penalty random severity=1.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROFILES: ProfileId[] = ["mike", "andy"];

async function handle(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await Promise.all(
    PROFILES.map(async (slug) => {
      try {
        const r = await resolveStreakAtMidnight(slug);
        return { slug, ...r };
      } catch (err) {
        return {
          slug,
          outcome: "error" as const,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  return NextResponse.json({ ran_at: new Date().toISOString(), results });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
