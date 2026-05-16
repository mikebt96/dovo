import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { DAYS } from "@/lib/data/days";
import {
  exercisesVisibleFor,
  alternativeActivityFor,
} from "@/lib/data/training";
import { getDayMacros } from "@/lib/data/meals";

export default async function SemanaPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Semana completa
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Tu plan de 7 días
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-xl">
          Click en cualquier día para entrar al detalle.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day) => {
          const macros = getDayMacros(profile.id, day.key);
          const exCount = exercisesVisibleFor(profile.id, day.key).length;
          const alt = alternativeActivityFor(profile.id, day.key);
          return (
            <Link
              key={day.key}
              href={`/${profile.id}/semana/${day.key}`}
              className="card p-5 hover:border-[var(--color-accent)] transition group"
            >
              <p
                className="mono text-[10px] uppercase tracking-widest mb-1"
                style={{ color: profile.color }}
              >
                {day.key}
              </p>
              <h2 className="font-extrabold text-xl tracking-tight mb-1 group-hover:text-[var(--color-accent)] transition">
                {day.label}
              </h2>
              <p className="mono text-[10px] text-[var(--color-muted)] mb-3 leading-relaxed">
                {day.focus}
              </p>
              <div className="space-y-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
                <Row
                  label="Comidas"
                  value={`${macros.mealCount} · ${macros.kcal}kcal`}
                />
                <Row
                  label="Entreno"
                  value={
                    alt
                      ? alt
                      : exCount > 0
                      ? `${exCount} ejercicios`
                      : "Descanso"
                  }
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="mono text-[10px] text-[var(--color-muted)]">{label}</p>
      <p className="mono text-[10px] text-right">{value}</p>
    </div>
  );
}
