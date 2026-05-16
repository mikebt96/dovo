import { notFound } from "next/navigation";
import { getProfile, PROFILES } from "@/lib/profile";
import { PENALTIES_SEED } from "@/lib/data/rewards";
import {
  BigStat,
  Eyebrow,
  HRule,
  MetricBar,
  MetricRing,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import PairRingsLazy from "@/app/three/PairRingsLazy";

export default async function ParejaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();
  const partner = PROFILES[profile.partnerId];

  // Stub stats — Phase 3 wired to DB
  const mikeStats = { streak: 0, longest: 0, level: 1, xp: 0, coins: 0 };
  const andyStats = { streak: 0, longest: 0, level: 1, xp: 0, coins: 0 };
  const pairStreak = Math.min(mikeStats.streak, andyStats.streak);

  const groupedPenalties = PENALTIES_SEED.reduce<
    Record<number, typeof PENALTIES_SEED>
  >((acc, p) => {
    acc[p.severity] = acc[p.severity] || [];
    acc[p.severity].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-14 pb-20">
      {/* Hero — pair rings + big number */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-center pt-4">
        <div>
          <Eyebrow className="mb-3">
            <RoleDot who="both" />
            <span>Ambos cumpliendo</span>
          </Eyebrow>
          <h1
            className="font-extrabold tabular tracking-tight leading-[0.82]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(5rem, 16vw, 11rem)",
              color: "var(--color-accent)",
              letterSpacing: "-0.05em",
            }}
          >
            {pairStreak}
          </h1>
          <p className="mt-2 mono text-xs tracking-[0.22em] uppercase text-[color:var(--color-text-3)]">
            días seguidos · {profile.displayName} & {partner.displayName}
          </p>
          <div className="mt-6 max-w-md">
            <MetricBar value={pairStreak} max={21} />
            <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] mt-2">
              próximo bono en {Math.max(0, 21 - pairStreak)} días
            </p>
          </div>
        </div>

        <div className="w-full">
          <PairRingsLazy
            mikeProgress={mikeStats.streak === 0 ? 0.1 : Math.min(1, mikeStats.streak / 21)}
            andyProgress={andyStats.streak === 0 ? 0.1 : Math.min(1, andyStats.streak / 21)}
            pairStreak={pairStreak}
          />
        </div>
      </section>

      <HRule />

      {/* Individual streaks */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <PersonStats
          who="mike"
          name="Mike"
          streak={profile.id === "mike" ? mikeStats.streak : andyStats.streak}
          longest={profile.id === "mike" ? mikeStats.longest : andyStats.longest}
          isMe={profile.id === "mike"}
        />
        <PersonStats
          who="andy"
          name="Andy"
          streak={profile.id === "andy" ? mikeStats.streak : andyStats.streak}
          longest={profile.id === "andy" ? mikeStats.longest : andyStats.longest}
          isMe={profile.id === "andy"}
        />
      </section>

      <HRule />

      {/* Milestones */}
      <section>
        <SectionLabel right="bonos compartidos">Milestones</SectionLabel>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Milestone days={7} reward="2× XP toda la semana" pairStreak={pairStreak} />
          <Milestone days={14} reward="Sorpresa random gratis" pairStreak={pairStreak} />
          <Milestone days={30} reward="Premio del dúo gratis" pairStreak={pairStreak} />
        </div>
      </section>

      <HRule />

      {/* Debts */}
      <section>
        <SectionLabel right="al día">Deudas pendientes</SectionLabel>
        <div className="mt-6 py-10 text-center">
          <p
            className="font-extrabold lowercase tracking-tight leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              color: "var(--color-success)",
              letterSpacing: "-0.04em",
            }}
          >
            limpio.
          </p>
          <p
            className="mt-3 italic text-[color:var(--color-text-3)] leading-relaxed max-w-md mx-auto"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.02rem" }}
          >
            Cuando alguno del dúo rompa racha, aquí aparece lo que le debe al otro.
            Pago en especie — consensual, finito.
          </p>
        </div>
      </section>

      <HRule />

      {/* Penalties catalog */}
      <section>
        <SectionLabel right="por severidad">Catálogo de castigos</SectionLabel>
        <p className="mt-3 text-sm text-[color:var(--color-text-3)] max-w-2xl leading-relaxed">
          Lo que se cobra cuando alguien rompe racha. La severidad escala con
          qué tan grave fue la falla.
        </p>

        <div className="mt-8 space-y-10">
          {[1, 2, 3].map((sev) => {
            const sevColor =
              sev === 1 ? "var(--color-success)"
              : sev === 2 ? "var(--color-warning)"
              : "var(--color-danger)";
            const sevLabel =
              sev === 1 ? "1 día roto"
              : sev === 2 ? "3+ días rotos"
              : "Semana rota";
            return (
              <div key={sev}>
                <p className="mono text-[10px] tracking-[0.22em] uppercase mb-3" style={{ color: sevColor }}>
                  severidad {sev} · {sevLabel}
                </p>
                <ul className="divide-y divide-[color:var(--color-divider)]">
                  {groupedPenalties[sev]?.map((p, i) => (
                    <li key={i} className="py-3">
                      <p className="font-bold text-sm">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-[color:var(--color-text-3)] mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                      <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] mt-1.5 uppercase">
                        {p.category}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center mt-8">
        editable en fase 2 · si alguno no les gusta, lo cambian
      </p>
    </div>
  );
}

function PersonStats({
  who,
  name,
  streak,
  longest,
  isMe,
}: {
  who: "mike" | "andy";
  name: string;
  streak: number;
  longest: number;
  isMe: boolean;
}) {
  const accent = who === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";
  return (
    <div>
      <Eyebrow className="mb-3">
        <RoleDot who={who} />
        <span style={{ color: accent }}>{isMe ? "Tú" : name}</span>
        {isMe && (
          <span className="text-[color:var(--color-text-4)] normal-case lowercase tracking-normal">
            · {name}
          </span>
        )}
      </Eyebrow>
      <BigStat
        label="Racha actual"
        value={streak}
        unit="d"
        sub={`récord ${longest}d`}
        accent={accent}
      />
    </div>
  );
}

function Milestone({
  days,
  reward,
  pairStreak,
}: {
  days: number;
  reward: string;
  pairStreak: number;
}) {
  const hit = pairStreak >= days;
  const pct = Math.min(1, pairStreak / days);
  return (
    <div className="surface p-6 flex items-start gap-5">
      <MetricRing
        value={pairStreak}
        max={days}
        size={64}
        stroke={4}
        accent={hit ? "var(--color-success)" : "var(--color-accent)"}
      >
        <span
          className="mono text-[10px] tabular tracking-widest"
          style={{ color: hit ? "var(--color-success)" : "var(--color-accent)" }}
        >
          {hit ? "✓" : `${Math.round(pct * 100)}%`}
        </span>
      </MetricRing>
      <div className="flex-1 min-w-0">
        <p
          className="mono text-[10px] tracking-[0.22em] uppercase"
          style={{ color: hit ? "var(--color-success)" : "var(--color-accent)" }}
        >
          {days} días
        </p>
        <p className="text-sm font-bold mt-1 leading-snug">{reward}</p>
      </div>
    </div>
  );
}
