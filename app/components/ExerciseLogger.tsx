"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  initialEntry,
}: {
  storageKey: string;
  exercise: Exercise;
  profileId: ProfileId;
  accent: string;
  date?: string;                  // YYYY-MM-DD; si falta, queda solo en localStorage
  initialEntry?: LogEntry;        // snapshot del server (exercises_log) — gana sobre localStorage
}) {
  const [entry, setEntry] = useState<LogEntry>(initialEntry ?? { done: false });
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hidratación: server (initialEntry) gana, localStorage llena gaps.
  // Si initialEntry tiene done=true, ese es el estado canónico.
  // Si initialEntry está vacío y localStorage tiene algo, usar localStorage
  // (sesión optimista previa que server aún no ha confirmado).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const local: LogEntry | null = raw ? JSON.parse(raw) : null;
      if (initialEntry?.done) {
        setEntry(initialEntry);
      } else if (local) {
        setEntry(local);
      }
    } catch {}
    setHydrated(true);
    // initialEntry es SSR snapshot — no se re-evalúa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch {}
  }, [entry, storageKey, hydrated]);

  // Sync a DB. Strategy:
  //   - `done` toggle → persist inmediato (el row debe existir/borrar YA).
  //   - top_set typing → persist con debounce 600ms SOLO si done=true.
  //     Sin done, escribir top_set borraría el row (el action delete cuando
  //     done=false). El usuario tiene que cerrar el ciclo: marcar done antes
  //     de loguear pesos. Si edita después de done, capturamos cambios.
  // Si server falla, NO revertimos local (consistente con CheckList).
  function persistImmediate(next: LogEntry) {
    if (!date) return;
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
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

  function persistDebounced(next: LogEntry) {
    if (!date || !next.done) return; // sin done no persistimos cambios de top set
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
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
    }, 600);
  }

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, []);

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
              persistImmediate(next);
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
              setEntry((p) => {
                const next = {
                  ...p,
                  topSet: { ...(p.topSet ?? {}), weight: v },
                };
                persistDebounced(next);
                return next;
              })
            }
          />
          <LogInput
            label="Reps"
            value={entry.topSet?.reps ?? ""}
            placeholder={exercise.repsRange.split("-")[1] ?? "10"}
            onChange={(v) =>
              setEntry((p) => {
                const next = {
                  ...p,
                  topSet: { ...(p.topSet ?? {}), reps: v },
                };
                persistDebounced(next);
                return next;
              })
            }
          />
          <LogInput
            label="RPE"
            value={entry.topSet?.rpe ?? ""}
            placeholder="8"
            onChange={(v) =>
              setEntry((p) => {
                const next = {
                  ...p,
                  topSet: { ...(p.topSet ?? {}), rpe: v },
                };
                persistDebounced(next);
                return next;
              })
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
