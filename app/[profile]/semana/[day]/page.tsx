import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { getEffectiveMealsFor, getEffectiveDayMacros } from "@/lib/mealsServer";
import { getMealsFor } from "@/lib/data/meals";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { getDay, DAYS } from "@/lib/data/days";
import { isValidDayKey } from "@/lib/dates";
import CheckList from "@/app/components/CheckList";
import ExerciseLogger from "@/app/components/ExerciseLogger";
import {
  BracketLink,
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import WeightPlateLazy from "@/app/three/WeightPlateLazy";

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
  const [meals, macros] = await Promise.all([
    getEffectiveMealsFor(profile.id, day.key).catch(() => getMealsFor(profile.id, day.key)),
    getEffectiveDayMacros(profile.id, day.key).catch(() => ({ kcal: 0, proteinG: 0, mealCount: 0 })),
  ]);
  const exercises = exercisesVisibleFor(profile.id, day.key);
  const altActivity = alternativeActivityFor(profile.id, day.key);

  const dayIdx = DAYS.findIndex((d) => d.key === day.key);
  const prevDay = dayIdx > 0 ? DAYS[dayIdx - 1] : null;
  const nextDay = dayIdx < DAYS.length - 1 ? DAYS[dayIdx + 1] : null;

  const accent =
    profile.id === "mike"
      ? "var(--color-role-mike)"
      : "var(--color-role-andy)";

  // Volume hint para WeightPlate: total reps * average sets * something. Stub.
  const volumeHint = exercises.reduce((acc, e) => acc + (e.sets ?? 3) * 8, 0);

  const mealItems = meals.map((m) => ({
    id: m.id,
    primary: (
      <div>
        <p
          className="mono text-[10px] tracking-widest mb-1"
          style={{ color: "var(--color-accent)" }}
        >
          {m.time} · {m.slotName}
        </p>
        <p className="font-bold text-sm leading-tight">{m.name}</p>
        <p className="text-xs text-[color:var(--color-text-3)] mt-1 leading-relaxed">
          {m.ingredients}
        </p>
        {m.prepInstructions && (
          <p
            className="mt-3 pl-3 border-l-2 text-xs italic text-[color:var(--color-text-2)] leading-relaxed"
            style={{
              borderColor: "var(--color-accent)",
              fontFamily: "var(--font-serif)",
              fontSize: "0.9rem",
            }}
          >
            <span
              className="mono not-italic text-[10px] block mb-1 tracking-widest"
              style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
            >
              PREP
            </span>
            {m.prepInstructions}
          </p>
        )}
      </div>
    ),
    meta: (
      <p className="mono text-[10px] tabular text-right text-[color:var(--color-text-3)]">
        {m.kcal} kcal
        <br />
        {m.proteinG}g P
      </p>
    ),
  }));

  return (
    <div className="space-y-12 pb-20">
      {/* Hero — day name + optional 3D plate */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-center pt-4">
        <div>
          <Eyebrow className="mb-3">
            <RoleDot who={profile.id} />
            <span>{profile.displayName.toLowerCase()}</span>
            <span className="text-[color:var(--color-text-4)]">·</span>
            <span>{day.key}</span>
          </Eyebrow>
          <h1
            className="font-extrabold lowercase tracking-tight leading-[0.82]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3.5rem, 11vw, 6.5rem)",
              color: "var(--color-text)",
              letterSpacing: "-0.04em",
            }}
          >
            {day.label.toLowerCase()}
          </h1>
          <p
            className="mt-4 mono text-xs tracking-[0.22em] uppercase"
            style={{ color: "var(--color-accent)" }}
          >
            {day.focus}
          </p>
          {day.notes && (
            <p className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl">
              {day.notes}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            {prevDay && (
              <BracketLink href={`/${profile.id}/semana/${prevDay.key}`}>
                ← {prevDay.label.slice(0, 3).toLowerCase()}
              </BracketLink>
            )}
            {nextDay && (
              <BracketLink href={`/${profile.id}/semana/${nextDay.key}`}>
                {nextDay.label.slice(0, 3).toLowerCase()} →
              </BracketLink>
            )}
          </div>
        </div>

        {/* Show plate only on training days; else show empty space */}
        {exercises.length > 0 && !altActivity && (
          <div className="w-full">
            <WeightPlateLazy weightKg={Math.max(10, Math.min(50, volumeHint / 8))} />
          </div>
        )}
      </section>

      <HRule />

      {/* Nutrition */}
      <section>
        <SectionLabel right={`${macros.kcal} kcal · ${macros.proteinG}g P`}>
          Nutrición · {meals.length} momentos
        </SectionLabel>
        <div className="mt-2">
          <CheckList
            storageKey={`meals-${profile.id}-${day.key}`}
            items={mealItems}
            accent={accent}
          />
        </div>
      </section>

      <HRule />

      {/* Training / Activity / Rest */}
      {altActivity ? (
        <section>
          <SectionLabel right={day.trainingDuration}>
            Actividad · {altActivity}
          </SectionLabel>
          <div className="mt-6 space-y-5">
            <p
              className="italic text-[color:var(--color-text-2)] leading-relaxed"
              style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}
            >
              Hoy te toca {altActivity.toLowerCase()}. Termina la sesión y
              regístrala en{" "}
              <Link
                href={`/${profile.id}/actividad`}
                className="border-b border-[color:var(--color-accent)] text-[color:var(--color-text)]"
              >
                actividad
              </Link>
              .
            </p>
            <BracketLink href={`/${profile.id}/actividad`}>
              Loguear ahora →
            </BracketLink>
          </div>
        </section>
      ) : exercises.length > 0 ? (
        <section>
          <SectionLabel
            right={day.trainingDuration ?? ""}
          >
            Entrenamiento · {day.trainingTitle ?? "Sesión"}
            {day.trainingTogether && (
              <span className="ml-3 mono text-[10px] tracking-widest" style={{ color: "var(--color-accent)" }}>
                · juntos
              </span>
            )}
          </SectionLabel>
          {day.warmup && (
            <div className="mt-4 pl-3 border-l-2 border-[color:var(--color-success)]">
              <p className="mono text-[10px] tracking-widest text-[color:var(--color-success)] mb-1">
                CALENTAMIENTO
              </p>
              <p className="text-xs text-[color:var(--color-text-2)] leading-relaxed">
                {day.warmup}
              </p>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {exercises.map((ex) => (
              <ExerciseLogger
                key={ex.id}
                storageKey={`ex-${profile.id}-${day.key}-${ex.id}`}
                exercise={ex}
                profileId={profile.id}
                accent={accent}
              />
            ))}
          </div>
          {day.cardio && (
            <div className="mt-4 pl-3 border-l-2" style={{ borderColor: "var(--color-role-mike)" }}>
              <p className="mono text-[10px] tracking-widest mb-1" style={{ color: "var(--color-role-mike)" }}>
                CARDIO FINAL
              </p>
              <p className="text-xs text-[color:var(--color-text-2)] leading-relaxed">
                {day.cardio}
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="py-16 text-center">
          <Eyebrow className="justify-center mb-5">Descanso</Eyebrow>
          <h2
            className="font-extrabold lowercase tracking-tight leading-[0.82]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(4rem, 14vw, 8rem)",
              color: "var(--color-text-2)",
              letterSpacing: "-0.04em",
            }}
          >
            descanso
          </h2>
          <p
            className="mt-6 italic text-[color:var(--color-text-3)] leading-relaxed max-w-md mx-auto"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem" }}
          >
            Caminata, foam roller, estiramientos. El músculo no crece en el gym
            — crece aquí.
          </p>
        </section>
      )}
    </div>
  );
}
