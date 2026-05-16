import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { getMealsFor, getDayMacros } from "@/lib/data/meals";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { getDay, DAYS } from "@/lib/data/days";
import { isValidDayKey } from "@/lib/dates";
import CheckList from "@/app/components/CheckList";
import ExerciseLogger from "@/app/components/ExerciseLogger";

export default async function DayPage({
  params,
}: {
  params: Promise<{ profile: string; day: string }>;
}) {
  const { profile: profileParam, day: dayParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();
  if (!isValidDayKey(dayParam)) notFound();

  const day = getDay(dayParam)!;
  const meals = getMealsFor(profile.id, day.key);
  const macros = getDayMacros(profile.id, day.key);
  const exercises = exercisesVisibleFor(profile.id, day.key);
  const altActivity = alternativeActivityFor(profile.id, day.key);

  // Adjacent days for nav
  const dayIdx = DAYS.findIndex((d) => d.key === day.key);
  const prevDay = dayIdx > 0 ? DAYS[dayIdx - 1] : null;
  const nextDay = dayIdx < DAYS.length - 1 ? DAYS[dayIdx + 1] : null;

  const mealItems = meals.map((m) => ({
    id: m.id,
    primary: (
      <div>
        <p
          className="mono text-[10px] mb-1"
          style={{ color: "var(--color-accent)" }}
        >
          {m.time} · {m.slotName}
        </p>
        <p className="font-bold text-sm leading-tight">{m.name}</p>
        <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
          {m.ingredients}
        </p>
        {m.prepInstructions && (
          <p className="text-xs text-[var(--color-text)] mt-2 px-2 py-1.5 rounded bg-[var(--color-card-2)] border-l-2 border-[var(--color-accent)] leading-relaxed">
            <strong className="text-[var(--color-accent)] mono text-[10px]">
              PREP
            </strong>
            <br />
            {m.prepInstructions}
          </p>
        )}
      </div>
    ),
    meta: (
      <p
        className="mono text-[10px]"
        style={{ color: "var(--color-muted)" }}
      >
        {m.kcal} kcal
        <br />
        {m.proteinG}g P
      </p>
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Day header w/ nav */}
      <section className="card p-5 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: profile.color }}
        />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
              {profile.displayName} · plan diario
            </p>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: profile.color }}
            >
              {day.label}
            </h1>
            <p className="mono text-xs text-[var(--color-accent)] uppercase tracking-widest mt-1">
              {day.focus}
            </p>
            {day.notes && (
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {day.notes}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {prevDay && (
              <Link
                href={`/${profile.id}/semana/${prevDay.key}`}
                className="chip hover:border-[var(--color-accent)] transition"
              >
                ← {prevDay.label.slice(0, 3)}
              </Link>
            )}
            {nextDay && (
              <Link
                href={`/${profile.id}/semana/${nextDay.key}`}
                className="chip hover:border-[var(--color-accent)] transition"
              >
                {nextDay.label.slice(0, 3)} →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Meals */}
      <section className="card overflow-hidden">
        <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="mono text-[10px] text-[var(--color-muted)]">
              Tus comidas
            </p>
            <h2 className="font-extrabold text-lg">
              {meals.length} momentos
            </h2>
          </div>
          <p
            className="mono text-xs text-right"
            style={{ color: "var(--color-accent)" }}
          >
            {macros.kcal} kcal · {macros.proteinG}g P
          </p>
        </header>
        <CheckList
          storageKey={`meals-${profile.id}-${day.key}`}
          items={mealItems}
          accent={profile.color}
        />
      </section>

      {/* Training or alt activity */}
      {altActivity ? (
        <section className="card p-6 text-center">
          <p className="text-3xl mb-2">🩰</p>
          <p className="mono text-[10px] text-[var(--color-muted)] mb-2">
            Hoy haces
          </p>
          <h2
            className="text-2xl font-extrabold tracking-tight mb-3"
            style={{ color: profile.color }}
          >
            {altActivity}
          </h2>
          <Link
            href={`/${profile.id}/actividad`}
            className="mono text-xs px-4 py-2 rounded inline-block transition"
            style={{
              background: profile.color,
              color: "#000",
            }}
          >
            LOGUEAR ACTIVIDAD →
          </Link>
        </section>
      ) : exercises.length > 0 ? (
        <section className="card overflow-hidden">
          <header className="px-5 py-4 border-b border-[var(--color-border)]">
            <p className="mono text-[10px] text-[var(--color-muted)]">
              {day.trainingTogether ? "Entrenan juntos" : "Tú solo"}
            </p>
            <h2 className="font-extrabold text-lg">
              {day.trainingTitle}
            </h2>
            {day.trainingDuration && (
              <p className="mono text-[10px] text-[var(--color-muted)] mt-1">
                {day.trainingDuration}
              </p>
            )}
          </header>

          {day.warmup && (
            <div className="mx-5 mt-4 p-3 rounded bg-[var(--color-card-2)] border-l-2 border-[var(--color-green)]">
              <p className="mono text-[10px] text-[var(--color-green)] mb-1 uppercase tracking-widest">
                Calentamiento
              </p>
              <p className="text-xs text-[var(--color-muted)]">{day.warmup}</p>
            </div>
          )}

          <div className="p-5 space-y-3">
            {exercises.map((ex) => (
              <ExerciseLogger
                key={ex.id}
                storageKey={`ex-${profile.id}-${day.key}-${ex.id}`}
                exercise={ex}
                profileId={profile.id}
                accent={profile.color}
              />
            ))}
          </div>

          {day.cardio && (
            <div className="mx-5 mb-5 p-3 rounded bg-[var(--color-card-2)] border-l-2 border-[var(--color-mike)]">
              <p className="mono text-[10px] text-[var(--color-mike)] mb-1 uppercase tracking-widest">
                Cardio final
              </p>
              <p className="text-xs text-[var(--color-muted)]">{day.cardio}</p>
            </div>
          )}
        </section>
      ) : (
        <section className="card p-8 text-center">
          <p className="text-4xl mb-3">🛌</p>
          <h2 className="font-extrabold text-xl mb-2">Descanso activo</h2>
          <p className="text-sm text-[var(--color-muted)] max-w-md mx-auto">
            Caminata ligera, foam roller, estiramientos. No te pongas a
            entrenar &mdash; el descanso es donde el músculo crece.
          </p>
        </section>
      )}
    </div>
  );
}
