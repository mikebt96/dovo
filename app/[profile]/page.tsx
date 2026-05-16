import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { getMealsFor, getDayMacros } from "@/lib/data/meals";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { DAYS, getDay } from "@/lib/data/days";
import { todayKey } from "@/lib/dates";

export default async function ProfileDashboard({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const today = todayKey();
  const day = getDay(today)!;
  const meals = getMealsFor(profile.id, today);
  const macros = getDayMacros(profile.id, today);
  const exercises = exercisesVisibleFor(profile.id, today);
  const altActivity = alternativeActivityFor(profile.id, today);

  // Stub stats — Phase 3 wired to DB
  const stats = {
    level: 1,
    xp: 0,
    nextLevelXp: 500,
    streak: 0,
    longestStreak: 0,
    coins: 0,
    partnerStreak: 0,
  };

  return (
    <div className="space-y-6">
      {/* Streak / Level / Coins panel */}
      <section
        className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 relative overflow-hidden"
      >
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: profile.color }}
        />
        <StatBlock
          label="Streak"
          value={`${stats.streak}d`}
          sub={`Récord ${stats.longestStreak}d`}
          color={profile.color}
        />
        <StatBlock
          label="Nivel"
          value={`Lv ${stats.level}`}
          sub={`${stats.xp} / ${stats.nextLevelXp} XP`}
          color="var(--color-accent)"
        />
        <StatBlock
          label="Coins"
          value={stats.coins.toString()}
          sub="Para tienda"
          color="var(--color-orange)"
        />
        <StatBlock
          label={`Streak ${profile.partnerId === "mike" ? "Mike" : "Andy"}`}
          value={`${stats.partnerStreak}d`}
          sub="Pareja"
          color={profile.partnerId === "mike" ? "#6bf5ff" : "#ff6b9d"}
        />
      </section>

      {/* Today banner */}
      <section className="card p-6 relative overflow-hidden">
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Hoy es
        </p>
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1"
          style={{ color: profile.color }}
        >
          {day.label}
        </h1>
        <p className="mono text-xs text-[var(--color-accent)] uppercase tracking-widest">
          {day.focus}
        </p>
        {day.notes && (
          <p className="mt-3 text-sm text-[var(--color-muted)]">{day.notes}</p>
        )}
      </section>

      {/* Two-column: meals + training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meals */}
        <section className="card overflow-hidden">
          <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
              <p className="mono text-[10px] text-[var(--color-muted)] mb-0.5">
                Tus comidas hoy
              </p>
              <h2 className="font-extrabold text-lg">
                {meals.length} comidas
              </h2>
            </div>
            <div className="text-right">
              <p className="mono text-[10px] text-[var(--color-muted)]">
                Macros target
              </p>
              <p
                className="mono text-sm"
                style={{ color: "var(--color-accent)" }}
              >
                {macros.kcal} kcal · {macros.proteinG}g P
              </p>
            </div>
          </header>
          <ul className="divide-y divide-[var(--color-border)]">
            {meals.length === 0 ? (
              <li className="px-5 py-6 text-sm text-[var(--color-muted)]">
                Sin comidas planeadas hoy.
              </li>
            ) : (
              meals.map((meal) => (
                <li key={meal.id} className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <p className="mono text-[10px] text-[var(--color-accent)]">
                      {meal.time} · {meal.slotName}
                    </p>
                    <p className="mono text-[10px] text-[var(--color-muted)]">
                      {meal.kcal} kcal · {meal.proteinG}g P
                    </p>
                  </div>
                  <p className="font-bold text-sm leading-tight">{meal.name}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                    {meal.ingredients}
                  </p>
                </li>
              ))
            )}
          </ul>
          <Link
            href={`/${profile.id}/semana/${today}`}
            className="block px-5 py-3 mono text-[10px] uppercase tracking-widest text-center border-t border-[var(--color-border)] hover:bg-[var(--color-card-2)] transition"
            style={{ color: profile.color }}
          >
            Marcar comidas →
          </Link>
        </section>

        {/* Training */}
        <section className="card overflow-hidden">
          <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
              <p className="mono text-[10px] text-[var(--color-muted)] mb-0.5">
                {day.trainingTogether ? "Juntos" : altActivity ? "Tú haces" : "Entrena"}
              </p>
              <h2 className="font-extrabold text-lg">
                {altActivity ?? day.trainingTitle ?? "Descanso"}
              </h2>
            </div>
            {day.trainingDuration && (
              <p className="mono text-[10px] text-[var(--color-muted)]">
                {day.trainingDuration}
              </p>
            )}
          </header>
          <div className="px-5 py-4 space-y-3">
            {altActivity ? (
              <div className="rounded p-4 border-l-2 bg-[var(--color-card-2)]"
                style={{ borderColor: profile.color }}>
                <p className="text-sm leading-relaxed">
                  Hoy haces <strong style={{ color: profile.color }}>{altActivity}</strong>.
                  Lo logueas en la sección de actividad después.
                </p>
              </div>
            ) : exercises.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Día de descanso activo. Caminata, foam roller, estiramientos.
              </p>
            ) : (
              <>
                {day.warmup && (
                  <div className="rounded p-3 bg-[var(--color-card-2)] border-l-2 border-[var(--color-green)]">
                    <p className="mono text-[10px] text-[var(--color-green)] mb-1">
                      Calentamiento
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {day.warmup}
                    </p>
                  </div>
                )}
                <ul className="space-y-2">
                  {exercises.slice(0, 4).map((ex) => (
                    <li
                      key={ex.id}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-card-2)] p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-sm">{ex.name}</p>
                        <span
                          className="mono text-[10px]"
                          style={{ color: "var(--color-accent)" }}
                        >
                          {ex.sets} × {ex.repsRange}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted)] mb-2">
                        {ex.description}
                      </p>
                      {(profile.id === "mike" ? ex.weightMike : ex.weightAndy) && (
                        <span
                          className="chip"
                          style={{ color: profile.color, borderColor: profile.color }}
                        >
                          Tu peso:{" "}
                          {profile.id === "mike" ? ex.weightMike : ex.weightAndy}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {exercises.length > 4 && (
                  <p className="mono text-[10px] text-[var(--color-muted)] text-center pt-2">
                    +{exercises.length - 4} ejercicios más
                  </p>
                )}
              </>
            )}
          </div>
          {(exercises.length > 0 || altActivity) && (
            <Link
              href={
                altActivity
                  ? `/${profile.id}/actividad`
                  : `/${profile.id}/semana/${today}`
              }
              className="block px-5 py-3 mono text-[10px] uppercase tracking-widest text-center border-t border-[var(--color-border)] hover:bg-[var(--color-card-2)] transition"
              style={{ color: profile.color }}
            >
              {altActivity ? "Loguear actividad →" : "Loguear pesos →"}
            </Link>
          )}
        </section>
      </div>

      {/* Quick links */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink
          href={`/${profile.id}/super`}
          icon="🛒"
          label="Súper"
          sub="Lista por persona"
        />
        <QuickLink
          href={`/${profile.id}/prep`}
          icon="🕐"
          label="Prep dom"
          sub="40 min"
        />
        <QuickLink
          href={`/${profile.id}/tienda`}
          icon="🎁"
          label="Tienda"
          sub="Canjea coins"
        />
        <QuickLink
          href={`/${profile.id}/pareja`}
          icon="💑"
          label="Pareja"
          sub="Streaks & deudas"
        />
      </section>

      {/* Week overview */}
      <section className="card p-5">
        <p className="mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3">
          Tu semana de un vistazo
        </p>
        <ul className="grid grid-cols-7 gap-1 text-center">
          {DAYS.map((d) => (
            <Link
              key={d.key}
              href={`/${profile.id}/semana/${d.key}`}
              className={`rounded py-3 text-xs transition ${
                d.key === today
                  ? "ring-1"
                  : "bg-[var(--color-card-2)] hover:bg-[var(--color-card-3)]"
              }`}
              style={
                d.key === today
                  ? {
                      background: "var(--color-card-2)",
                      // @ts-expect-error -- custom ring color via CSS var
                      "--tw-ring-color": profile.color,
                    }
                  : undefined
              }
            >
              <p className="mono text-[10px] uppercase text-[var(--color-muted)]">
                {d.key}
              </p>
              <p className="text-xs mt-0.5">
                {d.hasTraining ? (d.trainingTogether ? "💪" : profile.id === "andy" && (d.key === "mar" || d.key === "jue" || d.key === "sab") ? "🩰" : "💪") : "🛌"}
              </p>
            </Link>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div>
      <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
        {label}
      </p>
      <p
        className="font-extrabold text-2xl tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
      <p className="mono text-[10px] text-[var(--color-dim)] mt-0.5">{sub}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="card p-4 hover:border-[var(--color-accent)] transition group"
    >
      <p className="text-xl mb-1.5">{icon}</p>
      <p className="font-bold text-sm group-hover:text-[var(--color-accent)] transition">
        {label}
      </p>
      <p className="mono text-[10px] text-[var(--color-muted)] mt-0.5">{sub}</p>
    </Link>
  );
}
