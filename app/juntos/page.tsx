import Link from "next/link";
import { PROFILES } from "@/lib/profile";
import { getMealsFor, getDayMacros } from "@/lib/data/meals";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { getDay, DAYS } from "@/lib/data/days";
import { todayKey } from "@/lib/dates";
import type { ProfileId } from "@/lib/types";

export default function JuntosPage() {
  const today = todayKey();
  const day = getDay(today)!;

  // Stub stats — Phase 3 wired to DB
  const mikeStats = { level: 1, xp: 0, streak: 0, coins: 0, longest: 0 };
  const andyStats = { level: 1, xp: 0, streak: 0, coins: 0, longest: 0 };
  const pairStreak = Math.min(mikeStats.streak, andyStats.streak);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/juntos" className="flex items-center gap-3">
            <div className="flex -space-x-1">
              <div className="w-3 h-3 rounded-full bg-[var(--color-mike)] ring-1 ring-[var(--color-bg)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--color-andy)] ring-1 ring-[var(--color-bg)]" />
            </div>
            <span className="font-extrabold tracking-tight">Juntos</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/mike"
              className="mono text-[10px] text-[var(--color-mike)] hover:underline"
            >
              ver mike
            </Link>
            <Link
              href="/andy"
              className="mono text-[10px] text-[var(--color-andy)] hover:underline"
            >
              ver andy
            </Link>
            <Link
              href="/"
              className="mono text-[10px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              cambiar
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Day banner */}
        <section className="card p-6 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, var(--color-mike) 0%, var(--color-andy) 100%)",
            }}
          />
          <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
            Hoy
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
            {day.label}
          </h1>
          <p className="mono text-xs text-[var(--color-accent)] uppercase tracking-widest">
            {day.focus}
          </p>
        </section>

        {/* PAIR STREAK — el centro de gravedad */}
        <section
          className="card p-6 text-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(107,245,255,0.04) 0%, rgba(255,107,157,0.04) 100%)",
          }}
        >
          <p className="mono text-[10px] text-[var(--color-muted)] mb-2 uppercase tracking-widest">
            Pair Streak · ambos cumpliendo
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "var(--color-mike)" }}
            />
            <p className="text-7xl font-extrabold tracking-tight">
              {pairStreak}
            </p>
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "var(--color-andy)" }}
            />
          </div>
          <p className="mono text-[10px] text-[var(--color-muted)] mb-4">
            días seguidos · próximo bono a los{" "}
            {pairStreak < 7 ? 7 : pairStreak < 14 ? 14 : pairStreak < 30 ? 30 : 90}
          </p>
          <div className="grid grid-cols-3 gap-3 text-left mt-5">
            <Milestone
              label="7 días"
              reward="2× XP toda la semana"
              hit={pairStreak >= 7}
            />
            <Milestone
              label="14 días"
              reward="Sorpresa random gratis"
              hit={pairStreak >= 14}
            />
            <Milestone
              label="30 días"
              reward="Premio pareja gratis"
              hit={pairStreak >= 30}
            />
          </div>
        </section>

        {/* Side-by-side stat panels */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PersonPanel id="mike" stats={mikeStats} otherStreak={andyStats.streak} />
          <PersonPanel id="andy" stats={andyStats} otherStreak={mikeStats.streak} />
        </section>

        {/* XP race this week */}
        <section className="card p-5">
          <header className="mb-4">
            <p className="mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-1">
              XP race · esta semana
            </p>
            <h2 className="font-extrabold text-lg">Quien gana mejor cumple</h2>
          </header>
          <XPBars mike={mikeStats.xp} andy={andyStats.xp} />
        </section>

        {/* Deudas pendientes */}
        <section className="card overflow-hidden">
          <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
              <p className="mono text-[10px] text-[var(--color-muted)]">
                Deudas activas
              </p>
              <h2 className="font-extrabold text-lg">Cuentas claras</h2>
            </div>
            <p className="mono text-[10px] text-[var(--color-green)]">CLEAN</p>
          </header>
          <div className="px-5 py-6 text-center">
            <p className="text-3xl mb-2">🤝</p>
            <p className="text-sm text-[var(--color-muted)]">
              Sin deudas pendientes. Mantengan el streak y siga así.
            </p>
          </div>
        </section>

        {/* Today's plan side by side */}
        <section>
          <header className="mb-3">
            <p className="mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-1">
              Plan de hoy · juntos
            </p>
            <h2 className="font-extrabold text-xl tracking-tight">
              {day.trainingTogether ? "Entrenamos juntos" : "Caminos separados hoy"}
            </h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DayCard id="mike" />
            <DayCard id="andy" />
          </div>
        </section>

        {/* Week overview shared */}
        <section className="card p-5">
          <p className="mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3">
            Semana compartida
          </p>
          <ul className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d) => (
              <li
                key={d.key}
                className={`rounded py-3 text-xs ${
                  d.key === today
                    ? "bg-[var(--color-card-2)] ring-1 ring-[var(--color-accent)]"
                    : "bg-[var(--color-card-2)]"
                }`}
              >
                <p className="mono text-[10px] uppercase text-[var(--color-muted)]">
                  {d.key}
                </p>
                <p className="text-xs mt-0.5">
                  {d.hasTraining
                    ? d.trainingTogether
                      ? "💪💪"
                      : "💪🩰"
                    : "🛌"}
                </p>
              </li>
            ))}
          </ul>
          <p className="mono text-[10px] text-[var(--color-muted)] text-center mt-3 leading-relaxed">
            💪💪 = juntos · 💪🩰 = Mike gym + Andy ballet · 🛌 = descanso
          </p>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] py-4">
        <p className="mono text-[10px] text-[var(--color-dim)] text-center">
          Mike & Andy · vista compartida · v1
        </p>
      </footer>
    </div>
  );
}

// ============ Components ============

function PersonPanel({
  id,
  stats,
  otherStreak,
}: {
  id: ProfileId;
  stats: { level: number; xp: number; streak: number; coins: number; longest: number };
  otherStreak: number;
}) {
  const p = PROFILES[id];
  const winning = stats.streak > otherStreak;
  const losing = stats.streak < otherStreak;
  return (
    <div className="card p-5 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: p.color }}
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="mono text-[10px] text-[var(--color-muted)] mb-0.5">
            {id === "mike" ? "⚡" : "🌸"} {p.displayName}
          </p>
          <h3
            className="font-extrabold text-2xl tracking-tight"
            style={{ color: p.color }}
          >
            Lv {stats.level}
          </h3>
        </div>
        {winning && (
          <span
            className="chip"
            style={{ color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
          >
            🔥 LIDERA
          </span>
        )}
        {losing && (
          <span className="chip" style={{ color: "var(--color-muted)" }}>
            atrás
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={`${stats.streak}d`} color={p.color} />
        <Stat label="XP" value={stats.xp.toString()} color="var(--color-accent)" />
        <Stat label="Coins" value={stats.coins.toString()} color="var(--color-orange)" />
      </div>
      <Link
        href={`/${id}`}
        className="block mt-4 mono text-[10px] uppercase tracking-widest text-center py-2 rounded border border-[var(--color-border)] hover:border-current transition"
        style={{ color: p.color }}
      >
        ir a su dashboard →
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <p className="mono text-[10px] text-[var(--color-muted)] mb-0.5">
        {label}
      </p>
      <p
        className="font-extrabold text-lg tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

function Milestone({
  label,
  reward,
  hit,
}: {
  label: string;
  reward: string;
  hit: boolean;
}) {
  return (
    <div
      className={`card p-3 ${hit ? "ring-1 ring-[var(--color-green)]" : ""}`}
    >
      <p
        className="mono text-[10px] uppercase tracking-widest"
        style={{
          color: hit ? "var(--color-green)" : "var(--color-accent)",
        }}
      >
        {hit ? "✓ " : ""}
        {label}
      </p>
      <p className="text-xs mt-1">{reward}</p>
    </div>
  );
}

function XPBars({ mike, andy }: { mike: number; andy: number }) {
  const max = Math.max(mike, andy, 100);
  return (
    <div className="space-y-3">
      <Bar
        name="Mike"
        value={mike}
        max={max}
        color="var(--color-mike)"
        emoji="⚡"
      />
      <Bar
        name="Andy"
        value={andy}
        max={max}
        color="var(--color-andy)"
        emoji="🌸"
      />
    </div>
  );
}

function Bar({
  name,
  value,
  max,
  color,
  emoji,
}: {
  name: string;
  value: number;
  max: number;
  color: string;
  emoji: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-bold" style={{ color }}>
          {emoji} {name}
        </p>
        <p className="mono text-xs" style={{ color }}>
          {value} XP
        </p>
      </div>
      <div className="h-2 bg-[var(--color-card-2)] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function DayCard({ id }: { id: ProfileId }) {
  const today = todayKey();
  const day = getDay(today)!;
  const p = PROFILES[id];
  const meals = getMealsFor(id, today);
  const macros = getDayMacros(id, today);
  const exercises = exercisesVisibleFor(id, today);
  const alt = alternativeActivityFor(id, today);

  return (
    <div className="card p-5 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: p.color }}
      />
      <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
        {id === "mike" ? "⚡" : "🌸"} {p.displayName}
      </p>
      <h3
        className="font-extrabold text-xl tracking-tight mb-3"
        style={{ color: p.color }}
      >
        {meals.length} comidas · {alt ? alt : exercises.length > 0 ? `${exercises.length} ejercicios` : "descanso"}
      </h3>
      <div className="space-y-1.5 mb-3 mono text-[10px] text-[var(--color-muted)]">
        <Row label="Target" value={`${macros.kcal} kcal · ${macros.proteinG}g P`} />
        <Row
          label="Hoy"
          value={
            alt
              ? alt
              : exercises.length > 0
              ? day.trainingTogether
                ? "Gym juntos"
                : "Gym solo"
              : "Descanso"
          }
        />
      </div>
      <Link
        href={`/${id}/semana/${today}`}
        className="mono text-[10px] uppercase tracking-widest block text-center py-2 rounded border border-[var(--color-border)] hover:border-current transition"
        style={{ color: p.color }}
      >
        ver detalle →
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-[var(--color-text)]">{value}</span>
    </div>
  );
}
