import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import type { ProfileId } from "@/lib/types";
import { nextLevelXp } from "./config";

export type Stats = {
  streak: number;
  longestStreak: number;
  freezes: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  coins: number;
  partnerStreak: number;
};

const ZERO: Stats = {
  streak: 0,
  longestStreak: 0,
  freezes: 1,
  level: 1,
  xp: 0,
  nextLevelXp: nextLevelXp(1),
  coins: 0,
  partnerStreak: 0,
};

/**
 * Lectura agregada para el dashboard. Falla suave devolviendo ZEROs
 * si Supabase no responde — el dashboard sigue renderizando con
 * placeholders, no se rompe.
 */
export async function getMyStats(slug: ProfileId): Promise<Stats> {
  try {
    const sb = getServerSupabase();

    const myUuid = await slugToUuid(slug);
    if (!myUuid) return ZERO;

    const partnerSlug: ProfileId = slug === "mike" ? "andy" : "mike";
    const partnerUuid = await slugToUuid(partnerSlug);

    const [streaksRes, xpRes, coinsRes, partnerStreakRes] = await Promise.all([
      sb
        .from("streaks")
        .select("current, longest, freezes_available")
        .eq("profile_id", myUuid)
        .maybeSingle(),
      sb.from("xp").select("total, level").eq("profile_id", myUuid).maybeSingle(),
      sb.from("coins").select("balance").eq("profile_id", myUuid).maybeSingle(),
      partnerUuid
        ? sb
            .from("streaks")
            .select("current")
            .eq("profile_id", partnerUuid)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const xpTotal = (xpRes.data?.total as number | undefined) ?? 0;
    const xpLevel = (xpRes.data?.level as number | undefined) ?? 1;

    return {
      streak: (streaksRes.data?.current as number | undefined) ?? 0,
      longestStreak: (streaksRes.data?.longest as number | undefined) ?? 0,
      freezes: (streaksRes.data?.freezes_available as number | undefined) ?? 1,
      level: xpLevel,
      xp: xpTotal,
      nextLevelXp: nextLevelXp(xpLevel),
      coins: (coinsRes.data?.balance as number | undefined) ?? 0,
      partnerStreak: (partnerStreakRes.data?.current as number | undefined) ?? 0,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[getMyStats] devolviendo ZERO (no DB o query falló):",
        err instanceof Error ? err.message : err,
      );
    }
    return ZERO;
  }
}
