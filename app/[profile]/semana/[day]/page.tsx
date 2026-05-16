import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { getEffectiveMealsFor, getEffectiveDayMacros } from "@/lib/mealsServer";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { getDay, DAYS } from "@/lib/data/days";
import { isValidDayKey, folioSerial } from "@/lib/dates";
import CheckList from "@/app/components/CheckList";
import ExerciseLogger from "@/app/components/ExerciseLogger";
import {
  Folio,
  Plate,
  Ticket,
  TicketHead,
  TicketBody,
  TicketFoot,
  Marginalia,
  Perforated,
  Stamp,
} from "@/app/components/carnet";

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
    getEffectiveMealsFor(profile.id, day.key),
    getEffectiveDayMacros(profile.id, day.key),
  ]);
  const exercises = exercisesVisibleFor(profile.id, day.key);
  const altActivity = alternativeActivityFor(profile.id, day.key);

  const dayIdx = DAYS.findIndex((d) => d.key === day.key);
  const prevDay = dayIdx > 0 ? DAYS[dayIdx - 1] : null;
  const nextDay = dayIdx < DAYS.length - 1 ? DAYS[dayIdx + 1] : null;

  const accent =
    profile.id === "mike"
      ? "var(--color-plate-mike)"
      : "var(--color-plate-andy)";

  const mealItems = meals.map((m) => ({
    id: m.id,
    primary: (
      <div>
        <p
          className="mono text-[10px] tracking-widest mb-1"
          style={{ color: "var(--color-overprint)" }}
        >
          {m.time} · {m.slotName}
        </p>
        <p className="font-bold text-sm leading-tight">
          {m.name}
          {m.replanned && (
            <span className="ml-2 align-middle">
              <Stamp sm>AI · rediseñada</Stamp>
            </span>
          )}
        </p>
        <p className="text-xs text-[color:var(--color-ink-mute)] mt-1 leading-relaxed">
          {m.ingredients}
        </p>
        {m.replanned && m.replanReason && (
          <p className="mono text-[10px] text-[color:var(--color-ink-mute)] mt-1 italic">
            {m.replanReason}
          </p>
        )}
        {m.prepInstructions && (
          <div
            className="mt-3 pl-3 border-l-2 dropcap text-xs text-[color:var(--color-ink-soft)] leading-relaxed"
            style={{
              borderColor: "var(--color-overprint)",
              fontFamily: "var(--font-stamp)",
              fontSize: "0.85rem",
            }}
          >
            <span
              className="mono not-italic text-[10px] block mb-1 tracking-widest"
              style={{ color: "var(--color-overprint)" }}
            >
              PREP
            </span>
            {m.prepInstructions}
          </div>
        )}
      </div>
    ),
    meta: (
      <p className="mono text-[10px] tabular text-right text-[color:var(--color-ink-mute)]">
        {m.kcal} kcal
        <br />
        {m.proteinG}g P
      </p>
    ),
  }));

  return (
    <div className="space-y-10">
      <Folio
        serial={folioSerial(profile.id, day.key)}
        title="PARTE COMPLETO"
        right={
          <span className="flex items-center gap-2">
            {prevDay && (
              <Link
                href={`/${profile.id}/semana/${prevDay.key}`}
                className="hover:text-[color:var(--color-ink)] transition"
              >
                ← {prevDay.label.slice(0, 3).toUpperCase()}
              </Link>
            )}
            {prevDay && nextDay && <span>·</span>}
            {nextDay && (
              <Link
                href={`/${profile.id}/semana/${nextDay.key}`}
                className="hover:text-[color:var(--color-ink)] transition"
              >
                {nextDay.label.slice(0, 3).toUpperCase()} →
              </Link>
            )}
          </span>
        }
      />

      {/* Day hero */}
      <section>
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-2">
              {profile.displayName.toUpperCase()} · {day.key.toUpperCase()}
            </p>
            <h1
              className="font-extrabold tracking-tight leading-[0.85]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 8vw, 5rem)",
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

      {/* Meals */}
      <Ticket>
        <TicketHead
          eyebrow={`PARTE NUTRICIONAL · ${meals.length} momentos`}
          title={
            <span>
              {macros.kcal} kcal
              <span className="text-[color:var(--color-ink-mute)] font-normal">
                {" · "}
              </span>
              {macros.proteinG}g P
            </span>
          }
          right={<Plate who={profile.id}>{profile.displayName}</Plate>}
        />
        <CheckList
          storageKey={`meals-${profile.id}-${day.key}`}
          items={mealItems}
          accent={accent}
        />
        <TicketFoot
          serial={`NUTR·${profile.id.toUpperCase()}·${day.key.toUpperCase()}`}
        />
      </Ticket>

      {/* Training or alt or rest */}
      {altActivity ? (
        <Ticket>
          <TicketHead
            eyebrow="PARTE DE ACTIVIDAD"
            title={altActivity}
            right={<Plate who={profile.id}>{profile.displayName}</Plate>}
          />
          <TicketBody>
            <p
              className="italic text-[color:var(--color-ink-soft)] leading-relaxed"
              style={{ fontFamily: "var(--font-stamp)", fontSize: "1.05rem" }}
            >
              Hoy te toca tu disciplina alterna. Acabas y la registras.
            </p>
            <Link
              href={`/${profile.id}/actividad`}
              className="btn-ink mt-5 inline-flex"
            >
              Loguear actividad →
            </Link>
          </TicketBody>
          <TicketFoot
            serial={`ACT·${profile.id.toUpperCase()}·${day.key.toUpperCase()}`}
          />
        </Ticket>
      ) : exercises.length > 0 ? (
        <Ticket>
          <TicketHead
            eyebrow={
              day.trainingTogether
                ? "PARTE DE ENTRENO · entrenan juntos"
                : "PARTE DE ENTRENO"
            }
            title={day.trainingTitle ?? "Entreno"}
            right={
              <div className="flex flex-col items-end gap-1">
                {day.trainingTogether ? (
                  <Plate who="both">Juntos</Plate>
                ) : (
                  <Plate who={profile.id}>{profile.displayName}</Plate>
                )}
                {day.trainingDuration && (
                  <span className="mono text-[10px] tabular text-[color:var(--color-ink-mute)]">
                    {day.trainingDuration}
                  </span>
                )}
              </div>
            }
          />
          <TicketBody className="space-y-4">
            {day.warmup && (
              <Marginalia tag="CALENTAMIENTO">{day.warmup}</Marginalia>
            )}
            <div className="space-y-2">
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
              <Marginalia tag="CARDIO FINAL">{day.cardio}</Marginalia>
            )}
          </TicketBody>
          <TicketFoot
            serial={`ENTR·${profile.id.toUpperCase()}·${day.key.toUpperCase()}`}
          />
        </Ticket>
      ) : (
        <section className="py-16 text-center">
          <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-4">
            PARTE DE REPOSO
          </p>
          <h2
            className="font-extrabold tracking-tight leading-[0.85]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(4rem, 14vw, 10rem)",
              color: "var(--color-ink-soft)",
            }}
          >
            descanso
          </h2>
          <p
            className="mt-6 italic text-[color:var(--color-ink-mute)] leading-relaxed max-w-md mx-auto"
            style={{ fontFamily: "var(--font-stamp)", fontSize: "1.05rem" }}
          >
            Caminata, foam roller, estiramientos. El músculo no crece en el gym
            — crece aquí.
          </p>
        </section>
      )}
    </div>
  );
}
