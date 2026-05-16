import Link from "next/link";
import { PROFILES } from "@/lib/profile";
import { getEffectiveMealsFor, getEffectiveDayMacros } from "@/lib/mealsServer";
import { getMealsFor } from "@/lib/data/meals";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { getDay, DAYS } from "@/lib/data/days";
import { todayKey, dateLong } from "@/lib/dates";
import type { ProfileId } from "@/lib/types";
import {
  BigStat,
  BracketLink,
  Eyebrow,
  HRule,
  MetricBar,
  MetricRing,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import { Wordmark } from "@/app/components/brand";
import PairRingsLazy from "@/app/three/PairRingsLazy";

// `force-dynamic` evita prerender estático: esta página lee Supabase por
// request (via mealsServer/getEnv), que requiere env vars no presentes en
// build time. Sin esto el build falla al intentar SSG /juntos.
export const dynamic = "force-dynamic";

export default async function JuntosPage() {
  const today = todayKey();
  const day = getDay(today)!;

  // Stub stats — fase 3 desde DB
  const mikeStats = { level: 1, xp: 0, streak: 0, coins: 0, longest: 0 };
  const andyStats = { level: 1, xp: 0, streak: 0, coins: 0, longest: 0 };
  const pairStreak = Math.min(mikeStats.streak, andyStats.streak);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top glass bar */}
      <header className="sticky top-0 z-20 glass">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <Link
            href="/juntos"
            className="flex items-center gap-2.5"
          >
            <RoleDot who="both" />
            <Wordmark size="md" />
            <span className="mono text-[10px] tracking-widest text-[color:var(--color-accent)] hidden sm:inline">
              · juntos
            </span>
          </Link>
          <div className="flex items-center gap-5 mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
            <Link
              href="/mike"
              className="hover:opacity-80 transition"
              style={{ color: "var(--color-role-mike)" }}
            >
              ver mike
            </Link>
            <Link
              href="/andy"
              className="hover:opacity-80 transition"
              style={{ color: "var(--color-role-andy)" }}
            >
              ver andy
            </Link>
            <Link
              href="/"
              className="hover:text-[color:var(--color-text)] transition"
            >
              cambiar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-5 py-10 space-y-14 w-full">
        {/* Hero — pair rings 3D + pair streak number */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center pt-4">
          <div>
            <Eyebrow className="mb-3">
              <RoleDot who="both" />
              <span>Vista compartida</span>
              <span className="text-[color:var(--color-text-4)]">·</span>
              <span>{dateLong()}</span>
            </Eyebrow>
            <h1
              className="font-extrabold lowercase tracking-tight leading-[0.82] flex items-baseline gap-3 md:gap-5 flex-wrap"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 9vw, 5.5rem)",
                letterSpacing: "-0.04em",
              }}
            >
              <span style={{ color: "var(--color-role-mike)" }}>mike</span>
              <span className="text-[color:var(--color-text-4)] text-2xl md:text-4xl">+</span>
              <span style={{ color: "var(--color-role-andy)" }}>andy</span>
            </h1>
            <p
              className="mt-5 text-[color:var(--color-text-2)] leading-relaxed max-w-md"
              style={{ fontSize: "1.05rem" }}
            >
              Hoy es {day.label.toLowerCase()} — {day.focus.toLowerCase()}.
              {" "}{day.trainingTogether ? "Entrenan juntos." : "Caminos separados hoy."}
            </p>
          </div>

          <div className="w-full">
            <PairRingsLazy
              height="380px"
              mikeProgress={Math.min(1, (mikeStats.streak || 0.5) / 21)}
              andyProgress={Math.min(1, (andyStats.streak || 0.5) / 21)}
              pairStreak={pairStreak}
            />
          </div>
        </section>

        <HRule />

        {/* Pair streak BigStat */}
        <section className="py-4">
          <Eyebrow className="mb-4">Ambos cumpliendo</Eyebrow>
          <div className="flex items-baseline gap-6 flex-wrap">
            <p
              className="font-extrabold tabular tracking-tight leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(5rem, 16vw, 10rem)",
                color: "var(--color-accent)",
                letterSpacing: "-0.05em",
              }}
            >
              {pairStreak}
            </p>
            <p className="mono text-xs tracking-[0.22em] uppercase text-[color:var(--color-text-3)]">
              días seguidos
              <br />
              <span className="text-[color:var(--color-text-4)] normal-case lowercase tracking-normal">
                próximo bono en {Math.max(0, 21 - pairStreak)} días
              </span>
            </p>
          </div>
          <div className="mt-5 max-w-2xl">
            <MetricBar value={pairStreak} max={21} />
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Milestone days={7}  reward="2× XP toda la semana"     pairStreak={pairStreak} />
            <Milestone days={14} reward="Sorpresa random gratis"   pairStreak={pairStreak} />
            <Milestone days={30} reward="Premio del dúo gratis"    pairStreak={pairStreak} />
          </div>
        </section>

        <HRule />

        {/* Side-by-side BigStats */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <PersonBlock
            who="mike"
            stats={mikeStats}
            otherStreak={andyStats.streak}
          />
          <PersonBlock
            who="andy"
            stats={andyStats}
            otherStreak={mikeStats.streak}
          />
        </section>

        <HRule />

        {/* XP race */}
        <section>
          <SectionLabel right="esta semana">Race XP</SectionLabel>
          <div className="mt-6 space-y-6">
            <XPBar who="mike" name="Mike" value={mikeStats.xp} max={Math.max(mikeStats.xp, andyStats.xp, 100)} />
            <XPBar who="andy" name="Andy" value={andyStats.xp} max={Math.max(mikeStats.xp, andyStats.xp, 100)} />
          </div>
        </section>

        <HRule />

        {/* Pending debts */}
        <section>
          <SectionLabel right="al día">Deudas pendientes</SectionLabel>
          <div className="mt-6 py-8 text-center">
            <p
              className="font-extrabold lowercase tracking-tight leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "var(--color-success)",
                letterSpacing: "-0.04em",
              }}
            >
              limpio.
            </p>
            <p
              className="mt-3 italic text-[color:var(--color-text-3)] leading-relaxed max-w-md mx-auto"
              style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}
            >
              Cuando uno del dúo rompa racha, aquí aparece lo que le debe al
              otro. Pago en especie — consensual, finito.
            </p>
          </div>
        </section>

        <HRule />

        {/* Today plan side by side */}
        <section>
          <SectionLabel right={day.label}>Plan de hoy</SectionLabel>
          <h2
            className="mt-4 font-extrabold lowercase tracking-tight leading-[0.88]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              letterSpacing: "-0.03em",
            }}
          >
            {day.trainingTogether ? "entrenan juntos." : "caminos separados hoy."}
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <DayCard id="mike" />
            <DayCard id="andy" />
          </div>
        </section>

        <HRule />

        {/* Week glyph row */}
        <section>
          <SectionLabel>Semana compartida</SectionLabel>
          <ul className="grid grid-cols-7 gap-2 mt-5">
            {DAYS.map((d) => {
              const isToday = d.key === today;
              return (
                <li
                  key={d.key}
                  className="border border-[color:var(--color-divider)] py-4 px-1 text-center"
                  style={
                    isToday
                      ? {
                          borderColor: "var(--color-accent)",
                          background: "rgba(200,241,53,0.05)",
                        }
                      : undefined
                  }
                >
                  <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)]">
                    {d.key}
                  </p>
                  <p
                    className="text-base mt-2 leading-none"
                    style={{
                      color: d.hasTraining
                        ? d.trainingTogether
                          ? "var(--color-accent)"
                          : "var(--color-text-2)"
                        : "var(--color-text-4)",
                    }}
                  >
                    {d.hasTraining ? (d.trainingTogether ? "●" : "○") : "·"}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center mt-4 leading-relaxed">
            ● juntos · ○ separados · · descanso
          </p>
        </section>
      </main>

      <footer className="border-t border-[color:var(--color-divider)] py-6">
        <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center">
          dovo · vista compartida · privado
        </p>
      </footer>
    </div>
  );
}

function PersonBlock({
  who,
  stats,
  otherStreak,
}: {
  who: ProfileId;
  stats: { level: number; xp: number; streak: number; coins: number; longest: number };
  otherStreak: number;
}) {
  const p = PROFILES[who];
  const accent = who === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";
  const winning = stats.streak > otherStreak && stats.streak > 0;

  return (
    <div>
      <Eyebrow className="mb-4 justify-between">
        <span className="flex items-center gap-1.5">
          <RoleDot who={who} />
          <span style={{ color: accent }}>{p.displayName}</span>
        </span>
        {winning && (
          <span style={{ color: "var(--color-accent)" }}>★ lidera</span>
        )}
      </Eyebrow>
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        <BigStat label="Racha" value={stats.streak} unit="d" sub={`récord ${stats.longest}d`} accent={accent} />
        <BigStat label={`Nivel · ${stats.xp} XP`} value={`Lv${stats.level}`} sub="progreso" accent="var(--color-accent)" />
      </div>
    </div>
  );
}

function XPBar({
  who,
  name,
  value,
  max,
}: {
  who: ProfileId;
  name: string;
  value: number;
  max: number;
}) {
  const color = who === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-2" style={{ color }}>
          <RoleDot who={who} />
          {name}
        </p>
        <p className="mono text-xs tabular" style={{ color }}>
          {value} XP
        </p>
      </div>
      <MetricBar value={value} max={max} accent={color} />
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
  return (
    <div className="surface p-5 flex items-start gap-4">
      <MetricRing
        value={pairStreak}
        max={days}
        size={56}
        stroke={3}
        accent={hit ? "var(--color-success)" : "var(--color-accent)"}
      >
        <span
          className="mono text-[10px] tabular tracking-widest"
          style={{ color: hit ? "var(--color-success)" : "var(--color-accent)" }}
        >
          {hit ? "✓" : `${Math.round((pairStreak / days) * 100)}%`}
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

async function DayCard({ id }: { id: ProfileId }) {
  const today = todayKey();
  const day = getDay(today)!;
  const p = PROFILES[id];
  const [meals, macros] = await Promise.all([
    getEffectiveMealsFor(id, today).catch(() => getMealsFor(id, today)),
    getEffectiveDayMacros(id, today).catch(() => ({ kcal: 0, proteinG: 0, mealCount: 0 })),
  ]);
  const exercises = exercisesVisibleFor(id, today);
  const alt = alternativeActivityFor(id, today);
  const accent = id === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";

  return (
    <div className="surface p-6 space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <Eyebrow>
          <RoleDot who={id} />
          <span style={{ color: accent }}>{p.displayName.toLowerCase()}</span>
        </Eyebrow>
        <span className="mono text-[10px] tabular text-[color:var(--color-text-3)]">
          {macros.kcal} kcal · {macros.proteinG}g P
        </span>
      </div>

      <div>
        <p className="font-extrabold lowercase tracking-tight text-2xl leading-tight" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
          {meals.length} comidas
        </p>
        <p className="mono text-xs tracking-widest mt-1" style={{ color: accent }}>
          {alt
            ? alt.toLowerCase()
            : exercises.length > 0
            ? day.trainingTogether
              ? "gym juntos"
              : "gym solo"
            : "descanso"}
        </p>
      </div>

      <BracketLink href={`/${id}/semana/${today}`}>
        Ver detalle →
      </BracketLink>
    </div>
  );
}
