"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { logExercise, removeExerciseLog } from "@/lib/actions/workout";
import type { SerieLog } from "@/lib/workout/types";

// F9 · Logging inline de un ejercicio: N series de reps × kg. Prefill con las series
// del plan y el peso sugerido por progresión. El estado "registrado" llega del server
// (logsHoy) — tras guardar, revalidatePath refresca la página.
type SerieDraft = { reps: number | null; peso_kg: number | null };

export default function LogExerciseButton({
  grupoId,
  slug,
  conPeso,
  simple,
  defaultSeries,
  defaultReps,
  sugerenciaKg,
  loggedId,
}: {
  grupoId: string;
  slug: string;
  conPeso: boolean;
  /** Bloques por tiempo (cardio/pilates): sin series×reps que capturar — 1 tap "completado". */
  simple: boolean;
  defaultSeries: number;
  defaultReps: number | null;
  sugerenciaKg: number | null;
  loggedId: string | null;
}) {
  const t = useTranslations("rutina");
  const [open, setOpen] = useState(false);
  const [series, setSeries] = useState<SerieDraft[]>(() =>
    Array.from({ length: Math.min(6, Math.max(1, defaultSeries)) }, () => ({
      reps: defaultReps ?? 10,
      peso_kg: conPeso ? sugerenciaKg : null,
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function patch(i: number, k: keyof SerieDraft, v: number | null) {
    setSeries((prev) => prev.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  }

  function save() {
    setError(null);
    start(async () => {
      const limpio: SerieLog[] = series
        .map((s) => ({ reps: Math.round(s.reps ?? 0), peso_kg: conPeso ? s.peso_kg : null }))
        .filter((s) => s.reps >= 1);
      if (limpio.length === 0) {
        setError(t("logEmptyError"));
        return;
      }
      const res = await logExercise({ grupoId, exercise_slug: slug, series: limpio });
      if (!res.ok) setError(res.error);
      else setOpen(false);
    });
  }

  function marcarCompletado() {
    setError(null);
    start(async () => {
      const res = await logExercise({
        grupoId,
        exercise_slug: slug,
        series: [{ reps: 1, peso_kg: null }],
      });
      if (!res.ok) setError(res.error);
    });
  }

  function borrar() {
    if (!loggedId) return;
    setError(null);
    start(async () => {
      const res = await removeExerciseLog({ grupoId, id: loggedId });
      if (!res.ok) setError(res.error);
    });
  }

  if (loggedId && !open) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-[10px] mono uppercase tracking-[0.16em] text-signal">
          ✓ {t("logged")}
        </span>
        <button
          type="button"
          onClick={borrar}
          disabled={pending}
          aria-label={t("removeLog")}
          className="text-[10px] mono uppercase tracking-[0.16em] opacity-60 hover:opacity-100 underline underline-offset-2 disabled:opacity-40 py-2"
        >
          {t("removeLog")}
        </button>
        {error && <span className="text-[10px] text-red-600/80">{error}</span>}
      </span>
    );
  }

  // Bloques por tiempo: nada de inputs de reps sin sentido — 1 tap y listo (review F9).
  if (simple) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={marcarCompletado}
          disabled={pending}
          className="text-[10px] mono uppercase tracking-[0.16em] border border-ink/20 rounded-full px-4 py-2.5 hover:border-signal hover:text-signal transition-colors disabled:opacity-50"
        >
          {pending ? "…" : t("logDone")}
        </button>
        {error && <span className="text-[10px] text-red-600/80">{error}</span>}
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="text-[10px] mono uppercase tracking-[0.16em] border border-ink/20 rounded-full px-4 py-2.5 hover:border-signal hover:text-signal transition-colors"
      >
        {t("logCta")}
      </button>
    );
  }

  return (
    <div className="w-full mt-2 rounded-xl border border-ink/15 p-3 space-y-2" role="group" aria-label={t("seriesLabel")}>
      {series.map((s, i) => (
        <div key={i} className="flex items-center gap-2 min-h-11">
          <span className="text-[10px] mono uppercase tracking-wider opacity-60 w-4">{i + 1}</span>
          <label className="flex items-center gap-1.5 min-h-11">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={s.reps ?? ""}
              onChange={(e) =>
                patch(i, "reps", e.target.value === "" ? null : Number(e.target.value))
              }
              aria-label={t("logReps")}
              className="w-14 bg-transparent border-b border-ink/30 py-2 text-sm tabular-nums focus:outline-none focus:border-signal"
            />
            <span className="text-[10px] mono uppercase opacity-60">{t("logReps")}</span>
          </label>
          {conPeso && (
            <label className="flex items-center gap-1.5 min-h-11">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={500}
                step={2.5}
                value={s.peso_kg ?? ""}
                onChange={(e) =>
                  patch(i, "peso_kg", e.target.value === "" ? null : Number(e.target.value))
                }
                aria-label={t("logKg")}
                className="w-16 bg-transparent border-b border-ink/30 py-2 text-sm tabular-nums focus:outline-none focus:border-signal"
              />
              <span className="text-[10px] mono uppercase opacity-60">{t("logKg")}</span>
            </label>
          )}
          {series.length > 1 && (
            <button
              type="button"
              onClick={() => setSeries((prev) => prev.filter((_, j) => j !== i))}
              className="ml-auto text-base opacity-60 hover:opacity-100 h-11 w-11 -my-2 flex items-center justify-center"
              aria-label={t("removeLog")}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        {series.length < 6 && (
          <button
            type="button"
            onClick={() =>
              setSeries((prev) => [...prev, prev[prev.length - 1] ?? { reps: 10, peso_kg: null }])
            }
            className="text-[10px] mono uppercase tracking-[0.16em] opacity-70 hover:opacity-100 py-2"
          >
            {t("addSerie")}
          </button>
        )}
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] mono uppercase tracking-[0.16em] opacity-70 hover:opacity-100 py-2"
        >
          {t("logCancel")}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="text-[10px] mono uppercase tracking-[0.16em] bg-ink text-papel rounded-full px-5 py-2.5 hover:bg-signal hover:text-white transition-colors disabled:opacity-50"
        >
          {pending ? "…" : t("logSave")}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600/80">{error}</p>}
    </div>
  );
}
