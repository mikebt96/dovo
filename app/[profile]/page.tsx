import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { getMealsFor } from "@/lib/data/meals";
import { getEffectiveMealsFor, getEffectiveDayMacros } from "@/lib/mealsServer";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { DAYS, getDay } from "@/lib/data/days";
import { todayKey, folioSerial } from "@/lib/dates";
import {
  Folio,
  Plate,
  Ticket,
  TicketHead,
  TicketBody,
  TicketFoot,
  LeaderRow,
  Perforated,
  BlockProgress,
  Marginalia,
} from "@/app/components/carnet";

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
  const [meals, macros] = await Promise.all([
    getEffectiveMealsFor(profile.id, today),
    getEffectiveDayMacros(profile.id, today),
  ]);
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

  const accent =
    profile.id === "mike"
      ? "var(--color-plate-mike)"
      : "var(--color-plate-andy)";
  const partnerAccent =
    profile.partnerId === "mike"
      ? "var(--color-plate-mike)"
      : "var(--color-plate-andy)";

  return (
    <div className="space-y-10">
      <Folio serial={folioSerial(profile.id, today)} title="PARTE DIARIO" />

      {/* Day hero — no card, just type */}
      <section>
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-2">
              HOY · {day.key.toUpperCase()}
            </p>
            <h1
              className="font-extrabold tracking-tight leading-[0.85]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 8vw, 5.5rem)",
                color: accent,
              }}
            >
              {day.label.toLowerCase()}
            </h1>
          </div>
          <span
            className="mono text-[11px] tracking-[0.25em] uppercase"
            style={{ color: "var(--color-overprint)" }}
          >
            {day.focus}
          </span>
        </div>
        {day.notes && (
          <p
            className="mt-4 italic text-[color:var(--color-ink-soft)] leading-relaxed max-w-2xl"
            style={{ fontFamily: "var(--font-stamp)", fontSize: "1.05rem" }}
          >
            {day.notes}
          </p>
        )}
      </section>

      <Perforated />

      {/* Stat ledger */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
        <LeaderRow
          label="Racha"
          value={`${stats.streak} días`}
          accent={accent}
        />
        <LeaderRow
          label={`Racha ${profile.partnerId}`}
          value={`${stats.partnerStreak} días`}
          accent={partnerAccent}
        />
        <LeaderRow
          label={`Nivel · ${stats.xp}/${stats.nextLevelXp} XP`}
          value={`Lv ${stats.level}`}
          accent="var(--color-overprint)"
        />
        <LeaderRow
          label="Coins"
          value={String(stats.coins)}
          accent="var(--color-warn)"
        />
      </section>

      <Perforated />

      {/* Two columns: meals + training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meals */}
        <Ticket>
          <TicketHead
            eyebrow={`PARTE NUTRICIONAL · ${meals.length} momentos`}
            title={`${macros.kcal} kcal · ${macros.proteinG}g P`}
            right={<Plate who={profile.id}>{profile.displayName}</Plate>}
          />
          <TicketBody className="space-y-0 py-0">
            {meals.length === 0 ? (
              <p className="px-1 py-6 text-sm text-[color:var(--color-ink-mute)]">
                Sin comidas planeadas hoy.
              </p>
            ) : (
              <ul className="divide-y divide-[color:var(--color-rule)]">
                {meals.map((meal) => (
                  <li key={meal.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <p
                        className="mono text-[10px] tracking-widest"
                        style={{ color: "var(--color-overprint)" }}
                      >
                        {meal.time} · {meal.slotName}
                      </p>
                      <p className="mono text-[10px] tabular text-[color:var(--color-ink-mute)]">
                        {meal.kcal} kcal · {meal.proteinG}g P
                      </p>
                    </div>
                    <p className="font-bold text-sm leading-tight">
                      {meal.name}
                    </p>
                    <p className="text-xs text-[color:var(--color-ink-mute)] mt-1 leading-relaxed">
                      {meal.ingredients}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </TicketBody>
          <TicketFoot
            serial={`NUTR·${profile.id.toUpperCase()}·${today.toUpperCase()}`}
            action={
              <Link
                href={`/${profile.id}/semana/${today}`}
                className="hover:text-[color:var(--color-ink)] transition"
                style={{ color: accent }}
              >
                marcar comidas →
              </Link>
            }
          />
        </Ticket>

        {/* Training */}
        <Ticket>
          <TicketHead
            eyebrow={
              day.trainingTogether
                ? "PARTE DE ENTRENO · juntos"
                : altActivity
                ? "PARTE DE ACTIVIDAD"
                : "PARTE DE ENTRENO"
            }
            title={altActivity ?? day.trainingTitle ?? "Descanso"}
            right={
              <div className="flex flex-col items-end gap-1">
                {day.trainingTogether ? (
                  <Plate who="both">Juntos</Plate>
                ) : altActivity ? (
                  <Plate who={profile.id}>{profile.displayName}</Plate>
                ) : (
                  <Plate who={profile.id}>{profile.displayName}</Plate>
                )}
                {day.trainingDuration && (
                  <span className="mono text-[10px] text-[color:var(--color-ink-mute)]">
                    {day.trainingDuration}
                  </span>
                )}
              </div>
            }
          />
          <TicketBody className="space-y-3">
            {altActivity ? (
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                Hoy haces{" "}
                <strong style={{ color: accent, fontStyle: "italic" }}>
                  {altActivity}
                </strong>
                . Lo logueas en la sección de actividad.
              </p>
            ) : exercises.length === 0 ? (
              <p className="text-sm text-[color:var(--color-ink-mute)]">
                Descanso activo. Caminata, foam roller, estiramientos.
              </p>
            ) : (
              <>
                {day.warmup && (
                  <Marginalia tag="CALENTAMIENTO">{day.warmup}</Marginalia>
                )}
                <ul className="space-y-2">
                  {exercises.slice(0, 4).map((ex) => {
                    const sugWeight =
                      profile.id === "mike" ? ex.weightMike : ex.weightAndy;
                    return (
                      <li
                        key={ex.id}
                        className="border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className="font-bold text-sm leading-tight">
                            {ex.name}
                            {ex.starred && (
                              <span
                                className="ml-1.5"
                                style={{ color: "var(--color-overprint)" }}
                              >
                                ★
                              </span>
                            )}
                          </p>
                          <span
                            className="mono text-[10px] tabular whitespace-nowrap"
                            style={{ color: "var(--color-overprint)" }}
                          >
                            {ex.sets} × {ex.repsRange}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--color-ink-mute)] leading-relaxed">
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
                {exercises.length > 4 && (
                  <p className="mono text-[10px] text-[color:var(--color-ink-mute)] text-center pt-2">
                    + {exercises.length - 4} ejercicios más en el parte completo
                  </p>
                )}
              </>
            )}
          </TicketBody>
          <TicketFoot
            serial={`ENTR·${profile.id.toUpperCase()}·${today.toUpperCase()}`}
            action={
              (exercises.length > 0 || altActivity) && (
                <Link
                  href={
                    altActivity
                      ? `/${profile.id}/actividad`
                      : `/${profile.id}/semana/${today}`
                  }
                  className="hover:text-[color:var(--color-ink)] transition"
                  style={{ color: accent }}
                >
                  {altActivity ? "loguear actividad →" : "loguear pesos →"}
                </Link>
              )
            }
          />
        </Ticket>
      </div>

      <Perforated />

      {/* Quick passes */}
      <section>
        <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-4">
          PASES RÁPIDOS
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-[color:var(--color-rule-strong)]">
          <QuickPass
            href={`/${profile.id}/super`}
            glyph="◫"
            label="Súper"
            sub="lista por persona"
          />
          <QuickPass
            href={`/${profile.id}/prep`}
            glyph="⌗"
            label="Prep dom"
            sub="40 min"
          />
          <QuickPass
            href={`/${profile.id}/tienda`}
            glyph="◇"
            label="Tienda"
            sub="canjea coins"
          />
          <QuickPass
            href={`/${profile.id}/pareja`}
            glyph="⊛"
            label="Pareja"
            sub="streaks · deudas"
          />
        </div>
      </section>

      {/* Week strip */}
      <section>
        <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-4">
          SEMANA — VISTA RÁPIDA
        </p>
        <ul className="grid grid-cols-7 gap-2">
          {DAYS.map((d) => {
            const isToday = d.key === today;
            const isAltDay =
              profile.id === "andy" &&
              (d.key === "mar" || d.key === "jue" || d.key === "sab");
            const dayMeals = getMealsFor(profile.id, d.key).length;
            return (
              <Link
                key={d.key}
                href={`/${profile.id}/semana/${d.key}`}
                className={`group flex flex-col items-stretch ticket-flat px-2 py-3 transition-colors ${
                  isToday
                    ? "bg-[color:var(--color-paper-2)]"
                    : "hover:bg-[color:var(--color-paper)]"
                }`}
                style={
                  isToday
                    ? { borderColor: accent }
                    : undefined
                }
              >
                <p
                  className="mono text-[10px] tracking-widest text-center"
                  style={{
                    color: isToday ? accent : "var(--color-ink-mute)",
                  }}
                >
                  {d.key}
                </p>
                <p className="text-center font-bold text-[11px] mt-1 text-[color:var(--color-ink-soft)] truncate">
                  {d.hasTraining
                    ? d.trainingTogether
                      ? "⊛"
                      : isAltDay
                      ? "🩰"
                      : "⊕"
                    : "◌"}
                </p>
                <p className="mono text-[9px] text-center text-[color:var(--color-ink-dim)] mt-1 tabular">
                  {dayMeals}m
                </p>
              </Link>
            );
          })}
        </ul>
      </section>

      {/* Block progress for current streak */}
      <section className="pt-4">
        <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-2">
          PAIR STREAK
        </p>
        <BlockProgress
          value={Math.min(stats.streak, 21)}
          max={21}
          label="hasta bono de 21 días"
        />
      </section>
    </div>
  );
}

function QuickPass({
  href,
  glyph,
  label,
  sub,
}: {
  href: string;
  glyph: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group block px-4 py-5 border-r border-b border-[color:var(--color-rule-strong)] hover:bg-[color:var(--color-paper)] transition"
    >
      <span
        className="text-2xl text-[color:var(--color-ink-mute)] group-hover:text-[color:var(--color-overprint)] transition"
        aria-hidden="true"
      >
        {glyph}
      </span>
      <p className="font-bold text-sm mt-2 group-hover:text-[color:var(--color-overprint)] transition">
        {label}
      </p>
      <p className="mono text-[10px] text-[color:var(--color-ink-mute)] mt-0.5">
        {sub}
      </p>
    </Link>
  );
}
