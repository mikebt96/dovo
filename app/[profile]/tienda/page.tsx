import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { REWARDS_SEED } from "@/lib/data/rewards";
import {
  BigStat,
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import TrophyLazy from "@/app/three/TrophyLazy";
import type { TrophyTier } from "@/app/three/scenes/Trophy";

function bucketOf(costCoins: number): { label: string; tier: TrophyTier } {
  if (costCoins < 100) return { label: "Fáciles", tier: "easy" };
  if (costCoins < 300) return { label: "Medianos", tier: "mid" };
  if (costCoins < 600) return { label: "Grandes", tier: "big" };
  if (costCoins < 1500) return { label: "Épicos", tier: "epic" };
  return { label: "Legendarios", tier: "legendary" };
}

export default async function TiendaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  // Group by bucket
  const grouped = REWARDS_SEED.reduce<
    Record<TrophyTier, { label: string; rewards: typeof REWARDS_SEED }>
  >(
    (acc, r) => {
      const b = bucketOf(r.costCoins);
      acc[b.tier] = acc[b.tier] || { label: b.label, rewards: [] };
      acc[b.tier].rewards.push(r);
      return acc;
    },
    {} as Record<TrophyTier, { label: string; rewards: typeof REWARDS_SEED }>
  );

  const tierOrder: TrophyTier[] = ["easy", "mid", "big", "epic", "legendary"];

  const accent =
    profile.id === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";

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
        <BigStat label="Tu balance" value={0} unit="coins" sub="ganadas esta temporada" accent="var(--color-warning)" />
        <BigStat label="Balance compartido" value={0} unit="coins" sub="acumulado del dúo" />
      </section>

      <HRule />

      {/* Buckets */}
      <div className="space-y-16">
        {tierOrder.map((tier) => {
          const bucket = grouped[tier];
          if (!bucket) return null;

          return (
            <section key={tier}>
              <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6 items-start">
                {/* 3D trophy preview */}
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
                      desde {Math.min(...bucket.rewards.map(r => r.costCoins))} coins
                    </span>
                  </SectionLabel>
                  <ul className="mt-2 divide-y divide-[color:var(--color-divider)]">
                    {bucket.rewards.map((r, i) => (
                      <li
                        key={i}
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
                          <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] mt-2 uppercase">
                            {r.category}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className="font-extrabold text-xl tabular"
                            style={{ color: "var(--color-warning)" }}
                          >
                            {r.costCoins}
                          </p>
                          <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
                            coins
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center mt-8">
        catálogo editable en fase 2
      </p>
    </div>
  );
}
