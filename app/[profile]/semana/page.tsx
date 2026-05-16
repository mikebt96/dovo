import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { DAYS } from "@/lib/data/days";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { getDayMacros } from "@/lib/data/meals";
import { todayKey, folioSerial } from "@/lib/dates";
import { Folio, Perforated } from "@/app/components/carnet";

export default async function SemanaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();
  const today = todayKey();

  const accent =
    profile.id === "mike"
      ? "var(--color-plate-mike)"
      : "var(--color-plate-andy)";

  return (
    <div className="space-y-10">
      <Folio
        serial={folioSerial(profile.id)}
        title="ÍNDICE SEMANAL"
        right={
          <span className="text-[color:var(--color-ink-mute)]">7 partes</span>
        }
      />

      <section>
        <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-2">
          PLAN COMPLETO · {profile.displayName.toUpperCase()}
        </p>
        <h1
          className="font-extrabold tracking-tight leading-[0.88]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
          }}
        >
          Siete días, una pareja.
        </h1>
        <p
          className="mt-4 italic text-[color:var(--color-ink-soft)] leading-relaxed max-w-xl"
          style={{ fontFamily: "var(--font-stamp)", fontSize: "1.05rem" }}
        >
          Cada renglón abre su parte diario. La rutina no se negocia: solo se
          ejecuta.
        </p>
      </section>

      <Perforated thick />

      {/* Editorial table — one row per day with dot leaders */}
      <section>
        <ul className="divide-y divide-[color:var(--color-rule-strong)] border-t border-b border-[color:var(--color-rule-strong)]">
          {DAYS.map((day, idx) => {
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
                  className="group block py-5 transition-colors hover:bg-[color:var(--color-paper)]"
                >
                  <div className="flex items-baseline gap-4 px-2">
                    {/* roman index */}
                    <span
                      className="mono text-[10px] tracking-widest w-8 flex-shrink-0"
                      style={{ color: isToday ? accent : "var(--color-ink-mute)" }}
                    >
                      {toRoman(idx + 1)}
                    </span>

                    {/* day name */}
                    <span
                      className="font-extrabold tracking-tight text-2xl md:text-3xl flex-shrink-0 transition-colors"
                      style={{
                        color: isToday ? accent : "var(--color-ink)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {day.label.toLowerCase()}
                    </span>

                    {/* focus */}
                    <span className="hidden md:inline mono text-[10px] tracking-widest text-[color:var(--color-overprint)] flex-shrink-0">
                      · {day.focus}
                    </span>

                    {/* leader */}
                    <span
                      className="flex-1 overflow-hidden whitespace-nowrap mono text-[10px] tracking-[0.18em] text-[color:var(--color-rule-strong)]"
                      aria-hidden="true"
                    >
                      · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
                    </span>

                    {/* values */}
                    <span className="mono text-[11px] tabular text-[color:var(--color-ink-soft)] flex-shrink-0 hidden sm:inline">
                      {trainingText}
                    </span>
                    <span className="mono text-[11px] tabular text-[color:var(--color-ink-mute)] flex-shrink-0">
                      {macros.kcal}kc
                    </span>

                    {/* arrow */}
                    <span
                      className="mono text-[11px] flex-shrink-0 transition-transform group-hover:translate-x-1"
                      style={{ color: accent }}
                    >
                      →
                    </span>
                  </div>

                  {/* mobile: focus on second line */}
                  <p className="md:hidden mono text-[10px] tracking-widest text-[color:var(--color-overprint)] px-2 mt-1 ml-12">
                    {day.focus}
                  </p>

                  {isToday && (
                    <p
                      className="mono text-[10px] tracking-widest mt-1 px-2 ml-12"
                      style={{ color: accent }}
                    >
                      ⊕ HOY
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}
