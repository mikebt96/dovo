import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import type { ProfileId } from "@/lib/types";

export type RewardRow = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  costCoins: number;
  requiresBoth: boolean;
  active: boolean;
};

export type ClaimRow = {
  id: number;
  rewardId: number;
  unlockedForSlug: string | null;     // 'mike' | 'andy' | 'both'
  redeemed: boolean;
  redeemedAt: string | null;
  createdAt: string;
};

export type RewardsView = {
  rewards: RewardRow[];
  coinsBalance: number;
  partnerCoinsBalance: number;
  myUnredeemed: ClaimRow[];           // claims tuyas que no has marcado usadas aún
};

/**
 * Vista consolidada para la tienda. Una query batched para evitar waterfalls.
 *
 * Resiliente: si DB falla, devuelve { rewards: [], coinsBalance: 0, ... }
 * y la página puede degradar a "estás offline" o seed catalog.
 */
export async function getRewardsView(slug: ProfileId): Promise<RewardsView> {
  const empty: RewardsView = {
    rewards: [],
    coinsBalance: 0,
    partnerCoinsBalance: 0,
    myUnredeemed: [],
  };

  try {
    const sb = getServerSupabase();
    const myUuid = await slugToUuid(slug);
    if (!myUuid) return empty;

    const partnerSlug: ProfileId = slug === "mike" ? "andy" : "mike";
    const partnerUuid = await slugToUuid(partnerSlug);

    const [catalogRes, myCoinsRes, partnerCoinsRes, claimsRes] = await Promise.all([
      sb
        .from("rewards_catalog")
        .select("id, name, description, category, cost_coins, requires_both, active")
        .eq("active", true)
        .order("cost_coins", { ascending: true }),
      sb.from("coins").select("balance").eq("profile_id", myUuid).maybeSingle(),
      partnerUuid
        ? sb
            .from("coins")
            .select("balance")
            .eq("profile_id", partnerUuid)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      sb
        .from("rewards_unlocked")
        .select("id, reward_id, unlocked_for_slug, redeemed, redeemed_at, created_at")
        .eq("unlocked_by", myUuid)
        .eq("redeemed", false)
        .order("created_at", { ascending: false }),
    ]);

    if (catalogRes.error) {
      console.warn("[queries/rewards] catalog read:", catalogRes.error.message);
    }

    return {
      rewards: (catalogRes.data ?? []).map((r) => ({
        id: r.id as number,
        name: r.name as string,
        description: (r.description as string | null) ?? null,
        category: (r.category as string | null) ?? null,
        costCoins: r.cost_coins as number,
        requiresBoth: !!r.requires_both,
        active: !!r.active,
      })),
      coinsBalance: (myCoinsRes.data?.balance as number | undefined) ?? 0,
      partnerCoinsBalance:
        (partnerCoinsRes.data?.balance as number | undefined) ?? 0,
      myUnredeemed: (claimsRes.data ?? []).map((c) => ({
        id: c.id as number,
        rewardId: c.reward_id as number,
        unlockedForSlug: (c.unlocked_for_slug as string | null) ?? null,
        redeemed: !!c.redeemed,
        redeemedAt: (c.redeemed_at as string | null) ?? null,
        createdAt: c.created_at as string,
      })),
    };
  } catch (err) {
    console.warn("[queries/rewards] threw:", err);
    return empty;
  }
}
