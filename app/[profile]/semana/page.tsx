import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { DAYS } from "@/lib/data/days";
import { exercisesVisibleFor, alternativeActivityFor } from "@/lib/data/training";
import { getDayMacros } from "@/lib/data/meals";
import { getWeekConsumption } from "@/lib/historyServer";
import { todayKey, isoWeek, pad } from "@/lib/dates";
import {
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";

export default async function SemanaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();
  const today = todayKey();
  const week = pad(isoWeek(new Date()), 2);
  const consumption = await getWeekConsumption(profile.id).catch(() => null);

  // Target weekly = suma de macros plan de los 7 días
  const planKcalWeek = DAYS.reduce(
    (sum, d) => sum + getDayMacros(profile.id, d.key).kcal,
    0,
  );
  const consumedPct =
    planKcalWeek > 0 && consumption
      ? Math.min(100, Math.round((consumption.kcalReal / planKcalWeek) * 100))
      : 0;

  const accent =
    profile.id === "mike"
      ? "var(--color-role-mike)"
      : "var(--color-role-andy)";

  return (
    <div className="space-y-12 pb-20">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>Semana {week}</span>
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
          siete días.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Cada día abre su plan completo: comidas, entreno, prep si aplica.
          La rutina no se negocia — solo se ejecuta.
        </p>
      </section>

      <HRule />

      {consumption && consumption.mealsLogged > 0 && (
        <section>
          <SectionLabel
            right={`${consumption.mealsLogged} comidas registradas`}
          >
            Llevas esta semana
          </SectionLabel>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
            <div>
              <p
                className="font-extrabold tabular leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  color: accent,
                  letterSpacing: "-0.03em",
                }}
              >
                {consumption.kcalReal}
              </p>
              <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mt-1">
                kcal reales · {consumedPct}% del plan
              </p>
            </div>
            <div>
              <p
                className="font-extrabold tabular leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  color: "var(--color-text)",
                  letterSpacing: "-0.03em",
                }}
              >
                {consumption.proteinReal}
                <span className="text-[0.5em] ml-1 text-[color:var(--color-text-3)]">
                  g
                </span>
              </p>
              <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mt-1">
                proteína acumulada
              </p>
            </div>
            <div className="col-span-2 md:col-span-2">
              <ul className="grid grid-cols-7 gap-1">
                {DAYS.map((d) => {
                  const bucket = consumption.byDay[d.key];
                  const planMacros = getDayMacros(profile.id, d.key);
                  const pct =
                    planMacros.kcal > 0
                      ? Math.min(100, (bucket.kcal / planMacros.kcal) * 100)
                      : 0;
                  return (
                    <li key={d.key} className="text-center">
                      <div
                        className="h-12 bg-[color:var(--color-surface-1)] relative overflow-hidden mb-1"
                        aria-label={`${d.key}: ${bucket.kcal} kcal de ${planMacros.kcal}`}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 transition-all"
                          style={{
                            height: `${pct}%`,
                            background: accent,
                            opacity: bucket.meals > 0 ? 0.85 : 0,
                          }}
                        />
                      </div>
                      <p className="mono text-[9px] tracking-widest uppercase text-[color:var(--color-text-3)]">
                        {d.key}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mt-2 text-center">
                consumo real vs plan diario
              </p>
            </div>
          </div>
        </section>
      )}

      {consumption && consumption.mealsLogged > 0 && <HRule />}

      <SectionLabel right={`${DAYS.length} días`}>Plan completo</SectionLabel>

      <ul className="divide-y divide-[color:var(--color-divider)]">
        {DAYS.map((day) => {
          const macros = getDayMacros(profile.id, day.key);
          const exCount = exercisesVisibleFor(profile.id, day.key).length;
          const alt = alternativeActivityFor(profile.id, day.key);
          const trainingText = alt
            ? alt.toLowerCase()
            : exCount > 0
            ? `${exCount} ejercicios`
            : "descanso";
          const isToday = day.key === today;

          return (
            <li key={day.key}>
              <Link
                href={`/${profile.id}/semana/${day.key}`}
                className="group block py-6 transition-colors hover:bg-[color:var(--color-surface-1)]"
              >
                <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_auto_1fr_auto_auto] items-baseline gap-4 px-1">
                  <span
                    className="mono text-[10px] tracking-widest w-8 flex-shrink-0"
                    style={{ color: isToday ? accent : "var(--color-text-3)" }}
                  >
                    {day.key}
                  </span>

                  <span
                    className="font-extrabold lowercase tracking-tight text-2xl md:text-3xl flex-shrink-0 transition-colors"
                    style={{
                      color: isToday ? accent : "var(--color-text)",
                      fontFamily: "var(--font-display)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {day.label.toLowerCase()}
                  </span>

                  <span
                    className="hidden md:block flex-1 overflow-hidden whitespace-nowrap mono text-[10px] tracking-[0.18em] text-[color:var(--color-divider-strong)]"
                    aria-hidden="true"
                  >
                    · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
                  </span>

                  <span className="mono text-[11px] tabular text-[color:var(--color-text-2)] text-right flex-shrink-0 hidden sm:inline">
                    {trainingText}
                  </span>
                  <span className="mono text-[11px] tabular text-[color:var(--color-text-3)] flex-shrink-0">
                    {macros.kcal}kc
                  </span>
                </div>

                <p className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-accent)] px-1 mt-1 ml-12">
                  {day.focus}
                  {isToday && (
                    <span className="ml-3" style={{ color: accent }}>
                      · hoy
                    </span>
                  )}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
