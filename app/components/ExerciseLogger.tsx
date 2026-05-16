"use client";

import { useEffect, useState } from "react";
import type { Exercise, ProfileId } from "@/lib/types";

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
}: {
  storageKey: string;
  exercise: Exercise;
  profileId: ProfileId;
  accent: string;
}) {
  const [entry, setEntry] = useState<LogEntry>({ done: false });
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  const sugWeight =
    profileId === "mike" ? exercise.weightMike : exercise.weightAndy;

  return (
    <div
      className={`rounded border bg-[var(--color-card-2)] overflow-hidden transition ${
        entry.done
          ? "border-[var(--color-green)]/50 opacity-80"
          : "border-[var(--color-border)]"
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={entry.done}
            onChange={(e) =>
              setEntry((prev) => ({ ...prev, done: e.target.checked }))
            }
            className="mt-1 w-5 h-5 rounded border-2 cursor-pointer flex-shrink-0 appearance-none"
            style={
              entry.done
                ? {
                    background: "var(--color-green)",
                    borderColor: "var(--color-green)",
                  }
                : { borderColor: "var(--color-border)" }
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
                  <span className="ml-1.5 text-[var(--color-accent)]">★</span>
                )}
              </p>
              <span
                className="mono text-[10px] whitespace-nowrap flex-shrink-0"
                style={{ color: "var(--color-accent)" }}
              >
                {exercise.sets} × {exercise.repsRange}
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
              {exercise.description}
            </p>
            {sugWeight && (
              <p className="mono text-[10px] mt-2" style={{ color: accent }}>
                Peso sugerido: {sugWeight}
              </p>
            )}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mono text-[10px] mt-2 text-[var(--color-muted)] hover:text-[var(--color-accent)] transition"
            >
              {expanded ? "× cerrar" : "+ loguear top set"}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] grid grid-cols-3 gap-2">
            <LogInput
              label="Peso"
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
      <span className="mono text-[10px] text-[var(--color-muted)] block mb-1">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-sm mono focus:outline-none focus:border-[var(--color-accent)] transition"
      />
    </label>
  );
}
