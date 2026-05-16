import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { getEffectiveMealsFor, getEffectiveDayMacros } from "@/lib/mealsServer";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { DAYS, getDay } from "@/lib/data/days";
import { todayKey, dateLong } from "@/lib/dates";
import { getMealsFor } from "@/lib/data/meals";
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
import ActivityRingLazy from "@/app/three/ActivityRingLazy";
import { computeStreak } from "@/lib/streaks";
import { getMyStats } from "@/lib/gamification/stats";
import { getCheckedSet } from "@/lib/queries/checks";
import { getExercisesLogged } from "@/lib/queries/exercises";

// La página lee streaks desde Supabase por request, y getEnv() necesita
// vars solo presentes en runtime, no en build.
export const dynamic = "force-dynamic";

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
  const [
    meals,
    macros,
    myStreak,
    partnerStreak,
    gamification,
    checkedMeals,
    loggedExercises,
  ] = await Promise.all([
    getEffectiveMealsFor(profile.id, today).catch(() => getMealsFor(profile.id, today)),
    getEffectiveDayMacros(profile.id, today).catch(() => ({ kcal: 0, proteinG: 0, mealCount: 0 })),
    computeStreak(profile.id),
    computeStreak(profile.partnerId),
    getMyStats(profile.id),
    getCheckedSet({ profile: profile.id, table: "meals_log", date: today }),
    getExercisesLogged(profile.id, today),
  ]);
  const exercises = exercisesVisibleFor(profile.id, today);
  const altActivity = alternativeActivityFor(profile.id, today);

  // mealsDone: cuántas comidas planeadas para hoy ya están marcadas (intersect).
  // Esto evita inflar el count con comidas viejas / comidas de otro día que
  // estén en meals_log con la misma fecha por bugs de seed.
  const mealsDone = meals.filter((m) => checkedMeals[m.id]).length;

  // workoutDone: 1 si TODOS los ejercicios visibles de hoy tienen log.
  // En días de descanso o actividad alterna (ballet/pilates), exercises está
  // vacío y workoutDone se queda en 0 — el activity log se trackea aparte.
  const workoutDone =
    exercises.length > 0 && exercises.every((ex) => loggedExercises[ex.id]?.done)
      ? 1
      : 0;

  // Streaks: derivados de meals_log. XP/coins/level: incrementales desde xp_events.
  const stats = {
    level: gamification.level,
    xp: gamification.xp,
    nextLevelXp: gamification.nextLevelXp,
    streak: myStreak.current,
    longestStreak: myStreak.longest,
    coins: gamification.coins,
    partnerStreak: partnerStreak.current,
    mealsDone,
    workoutDone,
  };

  const accent =
    profile.id === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";
  const accentHex = profile.id === "mike" ? "#6bf5ff" : "#ff6b9d";

  const completion = meals.length === 0 ? 0 : stats.mealsDone / meals.length;

  return (
    <div className="space-y-14 pb-20">
      {/* Hero — big day name + 3D activity ring */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-center pt-6">
        <div>
          <Eyebrow className="mb-4">
            <RoleDot who={profile.id} />
            <span>{profile.displayName.toLowerCase()}</span>
            <span className="text-[color:var(--color-text-4)]">·</span>
            <span>{dateLong()}</span>
          </Eyebrow>
          <h1
            className="font-extrabold lowercase tracking-tight leading-[0.82]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3.5rem, 11vw, 7rem)",
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
            <p className="mt-5 text-[color:var(--color-text-2)] leading-relaxed max-w-xl">
              {day.notes}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {!altActivity && exercises.length > 0 && (
              <BracketLink href={`/${profile.id}/semana/${today}`}>
                Comenzar entreno →
              </BracketLink>
            )}
            {altActivity && (
              <BracketLink href={`/${profile.id}/actividad`}>
                Loguear {altActivity.toLowerCase()} →
              </BracketLink>
            )}
            <BracketLink href={`/${profile.id}/semana/${today}`}>
              Marcar comidas →
            </BracketLink>
          </div>
        </div>

        <div className="w-full">
          <ActivityRingLazy
            progress={completion === 0 ? 0.05 : completion}
            color={completion >= 1 ? "#c8f135" : accentHex}
          />
          <p className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)] text-center mt-2">
            {stats.mealsDone}/{meals.length} comidas · {stats.workoutDone === 1 ? "entreno hecho" : "entreno pendiente"}
          </p>
        </div>
      </section>

      <HRule />

      {/* BigStats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
        <BigStat label="Racha" value={stats.streak} unit="d" sub={`récord ${stats.longestStreak}d`} accent={accent} />
        <BigStat label={`Racha ${profile.partnerId}`} value={stats.partnerStreak} unit="d" sub="dúo" />
        <BigStat
          label={`Nivel · ${stats.xp}/${stats.nextLevelXp} XP`}
          value={`Lv${stats.level}`}
          sub="progreso"
          accent="var(--color-accent)"
        />
        <BigStat label="Coins" value={stats.coins} sub="para canjear" accent="var(--color-warning)" />
      </section>

      <HRule />

      {/* Two columns — meals + training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Meals */}
        <section>
          <SectionLabel right={`${macros.kcal} kcal · ${macros.proteinG}g P`}>
            Nutrición · {meals.length} momentos
          </SectionLabel>
          <ul className="mt-2">
            {meals.length === 0 ? (
              <li className="py-6 text-sm text-[color:var(--color-text-3)]">
                Sin comidas planeadas hoy.
              </li>
            ) : (
              meals.slice(0, 4).map((meal) => (
                <li key={meal.id} className="py-4 border-b border-[color:var(--color-divider)] last:border-b-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <p
                      className="mono text-[10px] tracking-widest"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {meal.time} · {meal.slotName}
                    </p>
                    <p className="mono text-[10px] tabular text-[color:var(--color-text-3)]">
                      {meal.kcal} kcal · {meal.proteinG}g P
                    </p>
                  </div>
                  <p className="font-bold text-sm leading-tight">{meal.name}</p>
                  <p className="text-xs text-[color:var(--color-text-3)] mt-1 leading-relaxed">
                    {meal.ingredients}
                  </p>
                </li>
              ))
            )}
          </ul>
          {meals.length > 0 && (
            <div className="mt-5">
              <BracketLink href={`/${profile.id}/semana/${today}`}>
                Marcar comidas →
              </BracketLink>
            </div>
          )}
        </section>

        {/* Training */}
        <section>
          <SectionLabel
            right={day.trainingDuration ?? (altActivity ? "actividad" : "descanso")}
          >
            Entrenamiento · {altActivity ?? day.trainingTitle ?? "Descanso"}
          </SectionLabel>
          <div className="mt-2 space-y-3">
            {altActivity ? (
              <p className="text-sm leading-relaxed text-[color:var(--color-text-2)] py-4">
                Hoy haces{" "}
                <span style={{ color: accent }} className="font-bold">
                  {altActivity}
                </span>
                . Termina y regístrala.
              </p>
            ) : exercises.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-3)] py-4">
                Descanso activo: caminata, foam roller, estiramientos.
              </p>
            ) : (
              <ul className="space-y-2">
                {exercises.slice(0, 4).map((ex) => {
                  const sugWeight =
                    profile.id === "mike" ? ex.weightMike : ex.weightAndy;
                  return (
                    <li
                      key={ex.id}
                      className="border-b border-[color:var(--color-divider)] py-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="font-bold text-sm leading-tight">
                          {ex.name}
                          {ex.starred && (
                            <span
                              className="ml-1.5"
                              style={{ color: "var(--color-accent)" }}
                            >
                              ★
                            </span>
                          )}
                        </p>
                        <span
                          className="mono text-[11px] tabular whitespace-nowrap"
                          style={{ color: "var(--color-accent)" }}
                        >
                          {ex.sets} × {ex.repsRange}
                        </span>
                      </div>
                      <p className="text-xs text-[color:var(--color-text-3)] leading-relaxed">
                        {ex.description}
                      </p>
                      {sugWeight && (
                        <span
                          className="mono text-[10px] tabular mt-1.5 inline-block"
                          style={{ color: accent }}
                        >
                          peso → {sugWeight}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {exercises.length > 4 && (
              <p className="mono text-[10px] text-[color:var(--color-text-3)] text-center pt-2">
                + {exercises.length - 4} ejercicios más
              </p>
            )}
          </div>
          {(exercises.length > 0 || altActivity) && (
            <div className="mt-5">
              <BracketLink
                href={
                  altActivity
                    ? `/${profile.id}/actividad`
                    : `/${profile.id}/semana/${today}`
                }
              >
                {altActivity ? "Loguear actividad →" : "Loguear pesos →"}
              </BracketLink>
            </div>
          )}
        </section>
      </div>

      <HRule />

      {/* Quick passes */}
      <section>
        <SectionLabel>Accesos directos</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <QuickPass href={`/${profile.id}/super`} label="Compras" sub="lista filtrada" />
          <QuickPass href={`/${profile.id}/prep`} label="Domingo" sub="40 min prep" />
          <QuickPass href={`/${profile.id}/tienda`} label="Recompensas" sub="canjear coins" />
          <QuickPass href={`/${profile.id}/duo`} label="Dúo" sub="rachas · deudas" />
        </div>
      </section>

      <HRule />

      {/* Week strip with rings */}
      <section>
        <SectionLabel>Semana — vista rápida</SectionLabel>
        <ul className="grid grid-cols-7 gap-2 mt-4">
          {DAYS.map((d) => {
            const isToday = d.key === today;
            const dayMeals = getMealsFor(profile.id, d.key).length;
            const dayEx = exercisesVisibleFor(profile.id, d.key).length;
            return (
              <li key={d.key}>
                <Link
                  href={`/${profile.id}/semana/${d.key}`}
                  className="group flex flex-col items-center gap-2 py-4 transition-colors hover:bg-[color:var(--color-surface-1)]"
                  style={isToday ? { background: "var(--color-surface-1)" } : undefined}
                >
                  <p
                    className="mono text-[10px] tracking-widest"
                    style={{ color: isToday ? accent : "var(--color-text-3)" }}
                  >
                    {d.key}
                  </p>
                  <MetricRing
                    value={0}
                    max={dayMeals + (dayEx > 0 ? 1 : 0)}
                    size={36}
                    stroke={3}
                    accent={isToday ? accent : "var(--color-text-4)"}
                  />
                  <p className="mono text-[9px] tabular text-[color:var(--color-text-4)]">
                    {dayMeals}m
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <HRule />

      {/* Pair streak bar */}
      <section>
        <SectionLabel right={`próximo bono en ${Math.max(0, 21 - Math.min(stats.streak, stats.partnerStreak))} días`}>
          Pair streak
        </SectionLabel>
        <div className="mt-4 space-y-3">
          <p className="font-extrabold text-3xl tabular" style={{ color: "var(--color-accent)" }}>
            {Math.min(stats.streak, stats.partnerStreak)} <span className="text-base font-normal text-[color:var(--color-text-3)]">días seguidos</span>
          </p>
          <MetricBar value={Math.min(stats.streak, stats.partnerStreak)} max={21} />
        </div>
      </section>
    </div>
  );
}

function QuickPass({
  href,
  label,
  sub,
}: {
  href: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group block px-4 py-5 border border-[color:var(--color-divider)] hover:border-[color:var(--color-text-3)] transition"
    >
      <p className="font-bold text-base group-hover:text-[color:var(--color-accent)] transition">
        {label}
      </p>
      <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] mt-1">
        {sub}
      </p>
    </Link>
  );
}
