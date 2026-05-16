import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { REWARDS_SEED } from "@/lib/data/rewards";

export default async function TiendaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const grouped = REWARDS_SEED.reduce<Record<string, typeof REWARDS_SEED>>(
    (acc, r) => {
      const bucket =
        r.costCoins < 100
          ? "Fáciles (50-100)"
          : r.costCoins < 300
          ? "Medianos (100-300)"
          : r.costCoins < 600
          ? "Grandes (300-600)"
          : r.costCoins < 1500
          ? "Épicos (600-1500)"
          : "Legendarios (1500+)";
      acc[bucket] = acc[bucket] || [];
      acc[bucket].push(r);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Tienda de premios
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Tu disciplina, en cosas reales
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-xl">
          Premios que ustedes mismos pueden editar. Los marcados como{" "}
          <strong style={{ color: profile.color }}>pareja</strong> necesitan que
          ambos hayan acumulado las coins.
        </p>
      </header>

      <section className="card p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
            Tu balance
          </p>
          <p
            className="font-extrabold text-3xl tracking-tight"
            style={{ color: "var(--color-orange)" }}
          >
            0 coins
          </p>
        </div>
        <div className="text-right">
          <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
            Balance pareja
          </p>
          <p className="font-extrabold text-3xl tracking-tight text-[var(--color-muted)]">
            0
          </p>
        </div>
      </section>

      {Object.entries(grouped).map(([bucket, rewards]) => (
        <section key={bucket} className="card overflow-hidden">
          <header className="px-5 py-3 bg-[var(--color-card-2)] border-b border-[var(--color-border)]">
            <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-accent)] font-bold">
              {bucket}
            </p>
          </header>
          <ul className="divide-y divide-[var(--color-border)]">
            {rewards.map((r, i) => (
              <li key={i} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">
                    {r.name}
                    {r.requiresBoth && (
                      <span
                        className="ml-2 mono text-[10px] tracking-wider"
                        style={{ color: profile.color }}
                      >
                        · PAREJA
                      </span>
                    )}
                  </p>
                  {r.description && (
                    <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                      {r.description}
                    </p>
                  )}
                  <p
                    className="mono text-[10px] mt-2 uppercase tracking-wider"
                    style={{ color: "var(--color-dim)" }}
                  >
                    {r.category}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className="mono text-lg font-bold"
                    style={{ color: "var(--color-orange)" }}
                  >
                    {r.costCoins}
                  </p>
                  <p className="mono text-[10px] text-[var(--color-muted)]">
                    coins
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mono text-[10px] text-[var(--color-dim)] text-center leading-relaxed">
        Estos son los premios sugeridos. En Fase 2 podrán editar, agregar y
        canjear.
      </p>
    </div>
  );
}
