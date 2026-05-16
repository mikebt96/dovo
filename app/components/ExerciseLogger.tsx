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
      className="ticket-flat overflow-hidden transition-all"
      style={
        entry.done
          ? {
              borderColor: "var(--color-paid)",
              opacity: 0.85,
            }
          : undefined
      }
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-4">
          {/* Stamped check */}
          <button
            type="button"
            onClick={() =>
              setEntry((prev) => ({ ...prev, done: !prev.done }))
            }
            className="mt-1 w-6 h-6 flex items-center justify-center flex-shrink-0 border-2 transition-all"
            style={{
              borderColor: entry.done
                ? "var(--color-paid)"
                : "var(--color-rule-strong)",
              background: entry.done ? "var(--color-paid)" : "transparent",
              boxShadow: entry.done
                ? "1px 1px 0 var(--color-rule-strong)"
                : "none",
            }}
            aria-pressed={entry.done}
            aria-label={entry.done ? "Marcar como pendiente" : "Marcar como hecho"}
          >
            {entry.done && (
              <span className="text-[0.8rem] font-black text-black">✓</span>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p
                className={`font-bold text-sm leading-tight ${
                  entry.done ? "line-through opacity-75" : ""
                }`}
              >
                <span className="mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)] mr-1.5">
                  {String(exercise.order).padStart(2, "0")}
                </span>
                {exercise.name}
                {exercise.starred && (
                  <span
                    className="ml-1.5"
                    style={{ color: "var(--color-overprint)" }}
                  >
                    ★
                  </span>
                )}
              </p>
              <span
                className="mono text-[10px] tabular whitespace-nowrap flex-shrink-0 tracking-widest"
                style={{ color: "var(--color-overprint)" }}
              >
                {exercise.sets} × {exercise.repsRange}
              </span>
            </div>
            <p
              className="text-xs text-[color:var(--color-ink-mute)] mt-1 leading-relaxed italic"
              style={{ fontFamily: "var(--font-stamp)" }}
            >
              {exercise.description}
            </p>
            {sugWeight && (
              <p
                className="mono text-[10px] mt-2 tracking-widest"
                style={{ color: accent }}
              >
                PESO SUGERIDO · {sugWeight}
              </p>
            )}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mono text-[10px] mt-2 tracking-widest text-[color:var(--color-ink-mute)] hover:text-[color:var(--color-overprint)] transition"
            >
              {expanded ? "× CERRAR" : "+ LOGUEAR TOP SET"}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-dashed border-[color:var(--color-rule-strong)] grid grid-cols-3 gap-2">
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
      <span className="mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)] block mb-1">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-strong)] px-2 py-1.5 text-sm mono tabular focus:outline-none focus:border-[color:var(--color-overprint)] transition"
      />
    </label>
  );
}
