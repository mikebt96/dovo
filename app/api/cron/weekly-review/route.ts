import { NextResponse } from "next/server";
import { generateWeeklyReview } from "@/lib/ai/weekly-review";
import { mondayOf } from "@/lib/dates";
import type { ProfileId } from "@/lib/types";

/**
 * Cron: weekly review para ambos profiles.
 *
 * Schedule (vercel.json): `0 3 * * 1` → Lunes 03:00 UTC = Domingo 21:00
 * MX (CDMX UTC-6). Revisa la semana que acaba de cerrar.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 *
 * Calculamos week_start como el lunes 7 días atrás de hoy (lunes), porque
 * estamos revisando la semana que terminó. Si corre martes por retry,
 * sigue revisando esa misma semana.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PROFILES: ProfileId[] = ["mike", "andy"];

function previousWeekStart(): string {
  const today = mondayOf();          // lunes en curso
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);  // lunes anterior
  return d.toISOString().slice(0, 10);
}

async function handle(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const week_start = previousWeekStart();

  const results = await Promise.all(
    PROFILES.map(async (slug) => {
      try {
        const res = await generateWeeklyReview(slug, week_start);
        return { slug, ...res };
      } catch (err) {
        return {
          slug,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { week_start, results },
    { status: allOk ? 200 : 207 },
  );
}

export async function POST(req: Request) {
  return handle(req);
}

// Vercel cron usa GET por default — soportamos ambos.
export async function GET(req: Request) {
  return handle(req);
}
