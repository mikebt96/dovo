import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { REWARDS_SEED } from "@/lib/data/rewards";
import { getRewardsView, type RewardRow } from "@/lib/queries/rewards";
import {
  BigStat,
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import TrophyLazy from "@/app/three/TrophyLazy";
import type { TrophyTier } from "@/app/three/scenes/Trophy";
import ClaimButton, { type ClaimStatus } from "./ClaimButton";

// Lee coins + catálogo + vouchers desde Supabase por request.
export const dynamic = "force-dynamic";

function bucketOf(costCoins: number): { label: string; tier: TrophyTier } {
  if (costCoins < 100) return { label: "Fáciles", tier: "easy" };
  if (costCoins < 300) return { label: "Medianos", tier: "mid" };
  if (costCoins < 600) return { label: "Grandes", tier: "big" };
  if (costCoins < 1500) return { label: "Épicos", tier: "epic" };
  return { label: "Legendarios", tier: "legendary" };
}

/**
 * Fallback al seed estático cuando la DB no tiene rewards aún (ej. dev sin
 * `npm run seed`). Sintetiza RewardRow[] con id negativo para que las
 * funciones de estado sigan funcionando — claim button quedará disabled
 * porque la action las rechazará por id inválido.
 */
function fallbackFromSeed(): RewardRow[] {
  return REWARDS_SEED.map((r, i) => ({
    id: -(i + 1),
    name: r.name,
    description: r.description ?? null,
    category: r.category ?? null,
    costCoins: r.costCoins,
    requiresBoth: r.requiresBoth,
    active: true,
  }));
}

export default async function TiendaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const view = await getRewardsView(profile.id);
  const rewards = view.rewards.length > 0 ? view.rewards : fallbackFromSeed();
  const claimsByReward = new Map<number, number>(); // reward_id → unredeemed claim_id (más reciente)
  for (const c of view.myUnredeemed) {
    if (!claimsByReward.has(c.rewardId)) claimsByReward.set(c.rewardId, c.id);
  }

  const accent =
    profile.id === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";

  function statusFor(r: RewardRow): {
    status: ClaimStatus;
    claimId?: number;
    shortfall?: number;
  } {
    // Voucher pendiente — UI te invita a marcarlo usado
    const claimId = claimsByReward.get(r.id);
    if (claimId !== undefined) {
      return { status: "claimed_unredeemed", claimId };
    }
    // Block si requires_both + partner sin coins
    if (r.requiresBoth && view.partnerCoinsBalance < r.costCoins) {
      return {
        status: "duo_blocked",
        shortfall: r.costCoins - view.partnerCoinsBalance,
      };
    }
    if (view.coinsBalance < r.costCoins) {
      return {
        status: "unaffordable",
        shortfall: r.costCoins - view.coinsBalance,
      };
    }
    return { status: "affordable" };
  }

  const grouped = rewards.reduce<
    Record<TrophyTier, { label: string; rewards: RewardRow[] }>
  >(
    (acc, r) => {
      const b = bucketOf(r.costCoins);
      acc[b.tier] = acc[b.tier] || { label: b.label, rewards: [] };
      acc[b.tier].rewards.push(r);
      return acc;
    },
    {} as Record<TrophyTier, { label: string; rewards: RewardRow[] }>,
  );

  const tierOrder: TrophyTier[] = ["easy", "mid", "big", "epic", "legendary"];

  return (
    <div className="space-y-12 pb-20">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>canjea coins</span>
        </Eyebrow>
        <h1
          className="font-extrabold lowercase tracking-tight leading-[0.85]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 9vw, 5.5rem)",
            color: "var(--color-text)",
            letterSpacing: "-0.04em",
          }}
        >
          recompensas.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Tu disciplina convertida en cosas reales. Lo que diga{" "}
          <span className="inline-flex items-center gap-1.5">
            <RoleDot who="both" />
            <span className="font-bold">compartido</span>
          </span>{" "}
          requiere que ambos hayan acumulado las coins.
        </p>
      </section>

      <HRule />

      {/* Balance */}
      <section className="grid grid-cols-2 gap-x-8 gap-y-8 max-w-2xl">
        <BigStat
          label="Tu balance"
          value={view.coinsBalance}
          unit="coins"
          sub="ganadas esta temporada"
          accent="var(--color-warning)"
        />
        <BigStat
          label="Balance compartido"
          value={view.coinsBalance + view.partnerCoinsBalance}
          unit="coins"
          sub="acumulado del dúo"
        />
      </section>

      {/* Vouchers pendientes */}
      {view.myUnredeemed.length > 0 && (
        <>
          <HRule />
          <section>
            <SectionLabel right={`${view.myUnredeemed.length}`}>
              Vouchers en tu wallet
            </SectionLabel>
            <p className="mt-2 text-sm text-[color:var(--color-text-3)] max-w-2xl leading-relaxed">
              Ya los reclamaste — falta usarlos. Cuando lo hagas, márcalos
              abajo en el catálogo.
            </p>
          </section>
        </>
      )}

      <HRule />

      {/* Buckets */}
      <div className="space-y-16">
        {tierOrder.map((tier) => {
          const bucket = grouped[tier];
          if (!bucket) return null;

          return (
            <section key={tier}>
              <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6 items-start">
                <div className="w-full">
                  <TrophyLazy tier={tier} />
                  <p className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)] text-center mt-1">
                    {bucket.label}
                  </p>
                </div>

                <div>
                  <SectionLabel right={`${bucket.rewards.length} premios`}>
                    {bucket.label}
                    <span className="ml-3 mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
                      desde {Math.min(...bucket.rewards.map((r) => r.costCoins))} coins
                    </span>
                  </SectionLabel>
                  <ul className="mt-2 divide-y divide-[color:var(--color-divider)]">
                    {bucket.rewards.map((r) => {
                      const { status, claimId, shortfall } = statusFor(r);
                      const isFromDb = r.id > 0;
                      return (
                        <li
                          key={r.id}
                          className="py-4 flex items-start justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-tight flex items-center gap-2 flex-wrap">
                              <span>{r.name}</span>
                              {r.requiresBoth && (
                                <span className="inline-flex items-center gap-1 mono text-[9px] tracking-widest uppercase text-[color:var(--color-accent)]">
                                  <RoleDot who="both" className="!w-1.5 !h-1.5" />
                                  compartido
                                </span>
                              )}
                            </p>
                            {r.description && (
                              <p className="text-xs text-[color:var(--color-text-3)] mt-1 leading-relaxed">
                                {r.description}
                              </p>
                            )}
                            {r.category && (
                              <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] mt-2 uppercase">
                                {r.category}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                            <div>
                              <p
                                className="font-extrabold text-xl tabular leading-none"
                                style={{ color: "var(--color-warning)" }}
                              >
                                {r.costCoins}
                              </p>
                              <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
                                coins
                              </p>
                            </div>
                            {isFromDb ? (
                              <ClaimButton
                                rewardId={r.id}
                                profile={profile.id}
                                status={status}
                                claimId={claimId}
                                costCoins={r.costCoins}
                                shortfall={shortfall}
                                accent={accent}
                              />
                            ) : (
                              <span className="mono text-[9px] tracking-widest text-[color:var(--color-text-4)]">
                                seed · npm run seed
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center mt-8">
        catálogo editable en fase 2 · vouchers idempotentes
      </p>
    </div>
  );
}
