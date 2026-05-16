"use client";

import { useEffect, useState, useTransition } from "react";
import type { Exercise, ProfileId } from "@/lib/types";
import { logExercise } from "@/lib/actions/exercise";

type LogEntry = {
  done: boolean;
  topSet?: { weight?: string; reps?: string; rpe?: string };
  notes?: string;
};

export default function ExerciseLogger({
  storageKey,
  exercise,
  profileId,
  accent,
  date,
}: {
  storageKey: string;
  exercise: Exercise;
  profileId: ProfileId;
  accent: string;
  date?: string;                  // YYYY-MM-DD; si falta, queda solo en localStorage
}) {
  const [entry, setEntry] = useState<LogEntry>({ done: false });
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setEntry(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch {}
  }, [entry, storageKey, hydrated]);

  // Sync a DB cuando cambia `done`. El top_set vigente al momento se persiste.
  // Strategy: localStorage = caché optimista, server = source of truth eventual.
  // Si server falla, NO revertimos local (consistente con CheckList).
  function persistToServer(next: LogEntry) {
    if (!date) return;
    startTransition(async () => {
      await logExercise({
        profile: profileId,
        date,
        exercise_id: exercise.id,
        done: next.done,
        top_set: next.topSet,
        notes: next.notes,
      });
    });
  }

  const sugWeight =
    profileId === "mike" ? exercise.weightMike : exercise.weightAndy;

  return (
    <div
      className={`border transition px-4 py-3.5 ${
        entry.done
          ? "border-[color:var(--color-success)] bg-[color:var(--color-success)]/5"
          : "border-[color:var(--color-divider)] hover:border-[color:var(--color-text-3)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={entry.done}
          onChange={(e) => {
            setEntry((prev) => {
              const next = { ...prev, done: e.target.checked };
              persistToServer(next);
              return next;
            });
          }}
          className="mt-1 w-5 h-5 cursor-pointer flex-shrink-0 appearance-none border transition"
          style={
            entry.done
              ? {
                  background: "var(--color-success)",
                  borderColor: "var(--color-success)",
                }
              : { borderColor: "var(--color-divider-strong)" }
          }
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`font-bold text-sm leading-tight ${
                entry.done ? "line-through opacity-70" : ""
              }`}
            >
              {exercise.order}. {exercise.name}
              {exercise.starred && (
                <span className="ml-1.5" style={{ color: "var(--color-accent)" }}>
                  ★
                </span>
              )}
            </p>
            <span
              className="mono text-[11px] tabular whitespace-nowrap flex-shrink-0"
              style={{ color: "var(--color-accent)" }}
            >
              {exercise.sets} × {exercise.repsRange}
            </span>
          </div>
          <p className="text-xs text-[color:var(--color-text-3)] mt-1 leading-relaxed">
            {exercise.description}
          </p>
          {sugWeight && (
            <p className="mono text-[10px] tabular mt-2" style={{ color: accent }}>
              peso → {sugWeight}
            </p>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mono text-[10px] mt-2 tracking-widest uppercase text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)] transition"
          >
            {expanded ? "× cerrar" : "+ loguear top set"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[color:var(--color-divider)] grid grid-cols-3 gap-3">
          <LogInput
            label="Peso (kg)"
            value={entry.topSet?.weight ?? ""}
            placeholder={sugWeight?.replace(/\D+$/g, "") ?? "kg"}
            onChange={(v) =>
              setEntry((p) => ({
                ...p,
                topSet: { ...(p.topSet ?? {}), weight: v },
              }))
            }
          />
          <LogInput
            label="Reps"
            value={entry.topSet?.reps ?? ""}
            placeholder={exercise.repsRange.split("-")[1] ?? "10"}
            onChange={(v) =>
              setEntry((p) => ({
                ...p,
                topSet: { ...(p.topSet ?? {}), reps: v },
              }))
            }
          />
          <LogInput
            label="RPE"
            value={entry.topSet?.rpe ?? ""}
            placeholder="8"
            onChange={(v) =>
              setEntry((p) => ({
                ...p,
                topSet: { ...(p.topSet ?? {}), rpe: v },
              }))
            }
          />
        </div>
      )}
    </div>
  );
}

function LogInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] block mb-1">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-bare input-mono"
      />
    </label>
  );
}
