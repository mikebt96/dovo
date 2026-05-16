import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile, PROFILES } from "@/lib/profile";
import { PENALTIES_SEED } from "@/lib/data/rewards";

export default async function ParejaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();
  const partner = PROFILES[profile.partnerId];

  const groupedPenalties = PENALTIES_SEED.reduce<
    Record<number, typeof PENALTIES_SEED>
  >((acc, p) => {
    acc[p.severity] = acc[p.severity] || [];
    acc[p.severity].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Pareja · streaks & deudas
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          {profile.displayName} ↔ {partner.displayName}
        </h1>
      </header>

      {/* Streak comparison */}
      <section className="grid grid-cols-2 gap-3">
        <PersonStreak
          name={profile.displayName}
          color={profile.color}
          streak={0}
          longest={0}
          isMe
        />
        <PersonStreak
          name={partner.displayName}
          color={partner.color}
          streak={0}
          longest={0}
        />
      </section>

      {/* Pair streak status */}
      <section
        className="card p-6 text-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(107,245,255,0.05) 0%, rgba(255,107,157,0.05) 100%)",
        }}
      >
        <p className="mono text-[10px] text-[var(--color-muted)] mb-2 uppercase tracking-widest">
          Pair streak · ambos cumpliendo
        </p>
        <p className="text-6xl font-extrabold tracking-tight mb-2">0</p>
        <p className="mono text-[10px] text-[var(--color-muted)]">
          días seguidos · próximo bono pareja a los 7
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-left">
          <Milestone label="7 días" reward="2× XP semana" />
          <Milestone label="14 días" reward="Sorpresa random" />
          <Milestone label="30 días" reward="Premio pareja gratis" />
        </div>
      </section>

      {/* Outstanding debts */}
      <section className="card overflow-hidden">
        <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
              Deudas pendientes
            </p>
            <h2 className="font-extrabold text-lg">
              Sin deudas activas
            </h2>
          </div>
          <p className="mono text-[10px] text-[var(--color-green)]">
            CLEAN
          </p>
        </header>
        <div className="px-5 py-8 text-center">
          <p className="text-3xl mb-2">🤝</p>
          <p className="text-sm text-[var(--color-muted)]">
            Cuando alguno rompa streak, aparece aquí lo que le debe al otro.
          </p>
        </div>
      </section>

      {/* Penalties catalog */}
      <section className="card overflow-hidden">
        <header className="px-5 py-4 border-b border-[var(--color-border)]">
          <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
            Catálogo de castigos
          </p>
          <h2 className="font-extrabold text-lg">
            Consensual · finito · no humillante
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-2 max-w-xl leading-relaxed">
            Lo que se cobra cuando alguien rompe streak. La severity escala con
            qué tan grave fue la falla.
          </p>
        </header>
        {[1, 2, 3].map((sev) => (
          <div
            key={sev}
            className="border-b border-[var(--color-border)] last:border-b-0"
          >
            <div className="px-5 py-3 bg-[var(--color-card-2)]">
              <p
                className="mono text-[10px] uppercase tracking-widest font-bold"
                style={{
                  color:
                    sev === 1
                      ? "var(--color-green)"
                      : sev === 2
                      ? "var(--color-orange)"
                      : "var(--color-red)",
                }}
              >
                Severity {sev} ·{" "}
                {sev === 1
                  ? "Rompiste 1 día"
                  : sev === 2
                  ? "Rompiste 3+ días"
                  : "Rompiste la semana"}
              </p>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {groupedPenalties[sev]?.map((p, i) => (
                <li key={i} className="px-5 py-3">
                  <p className="font-bold text-sm">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                  <p className="mono text-[10px] text-[var(--color-dim)] mt-1.5 uppercase tracking-wider">
                    {p.category}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <p className="mono text-[10px] text-[var(--color-dim)] text-center">
        Editable en Fase 2. Si alguno no les gusta, lo cambian.
      </p>
    </div>
  );
}

function PersonStreak({
  name,
  color,
  streak,
  longest,
  isMe,
}: {
  name: string;
  color: string;
  streak: number;
  longest: number;
  isMe?: boolean;
}) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: color }}
      />
      <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
        {isMe ? "Tú" : "Pareja"} · {name}
      </p>
      <p
        className="font-extrabold text-3xl tracking-tight"
        style={{ color }}
      >
        {streak}
        <span className="mono text-sm text-[var(--color-muted)] ml-1">
          días
        </span>
      </p>
      <p className="mono text-[10px] text-[var(--color-dim)] mt-1">
        Récord {longest}d
      </p>
    </div>
  );
}

function Milestone({ label, reward }: { label: string; reward: string }) {
  return (
    <div className="card p-3">
      <p
        className="mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--color-accent)" }}
      >
        {label}
      </p>
      <p className="text-xs mt-1">{reward}</p>
    </div>
  );
}
