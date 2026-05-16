"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  date: string;
  type: string;
  durationMin: number;
  intensity: number;
  notes?: string;
};

const ACTIVITY_TYPES = [
  { value: "ballet", label: "🩰 Ballet" },
  { value: "pilates", label: "🧘 Pilates" },
  { value: "running", label: "🏃 Running" },
  { value: "swimming", label: "🏊 Natación" },
  { value: "cycling", label: "🚴 Bici" },
  { value: "yoga", label: "🧘 Yoga" },
  { value: "walk", label: "🚶 Caminata" },
  { value: "other", label: "🎯 Otra" },
];

export default function ActivityLog({
  storageKey,
  accent,
  primarySport,
}: {
  storageKey: string;
  accent: string;
  primarySport?: string;
}) {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: primarySport ?? "ballet",
    durationMin: "60",
    intensity: "3",
    notes: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLogs(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(logs));
    } catch {}
  }, [logs, storageKey, hydrated]);

  function add() {
    const newEntry: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: draft.date,
      type: draft.type,
      durationMin: parseInt(draft.durationMin) || 0,
      intensity: parseInt(draft.intensity) || 3,
      notes: draft.notes || undefined,
    };
    setLogs((prev) => [newEntry, ...prev]);
    setDraft((d) => ({ ...d, notes: "" }));
  }

  function remove(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  const sorted = [...logs].sort((a, b) => (a.date > b.date ? -1 : 1));
  const weekTotal = logs
    .filter((l) => {
      const d = new Date(l.date);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .reduce((sum, l) => sum + l.durationMin, 0);

  return (
    <div className="space-y-6">
      {/* Add form */}
      <section className="card p-5 space-y-3">
        <p className="mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest">
          Agregar actividad
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Fecha">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-2 text-sm mono"
            />
          </Field>
          <Field label="Actividad">
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-2 text-sm"
            >
              {ACTIVITY_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duración (min)">
            <input
              type="number"
              inputMode="numeric"
              value={draft.durationMin}
              onChange={(e) =>
                setDraft({ ...draft, durationMin: e.target.value })
              }
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-2 text-sm mono"
            />
          </Field>
          <Field label="Intensidad (1-5)">
            <input
              type="number"
              min="1"
              max="5"
              value={draft.intensity}
              onChange={(e) =>
                setDraft({ ...draft, intensity: e.target.value })
              }
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-2 text-sm mono"
            />
          </Field>
        </div>
        <Field label="Notas (opcional)">
          <input
            type="text"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="ej: muy intenso, hicimos pliés extra"
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-2 text-sm"
          />
        </Field>
        <button
          type="button"
          onClick={add}
          className="mono text-xs px-4 py-2 rounded transition"
          style={{ background: accent, color: "#000" }}
        >
          + LOGUEAR
        </button>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="mono text-[10px] text-[var(--color-muted)]">
            Esta semana
          </p>
          <p
            className="font-extrabold text-2xl tracking-tight mt-1"
            style={{ color: accent }}
          >
            {weekTotal} min
          </p>
        </div>
        <div className="card p-4">
          <p className="mono text-[10px] text-[var(--color-muted)]">
            Total sesiones
          </p>
          <p className="font-extrabold text-2xl tracking-tight mt-1">
            {logs.length}
          </p>
        </div>
      </section>

      {/* History */}
      <section className="card overflow-hidden">
        <header className="px-5 py-4 border-b border-[var(--color-border)]">
          <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
            Historial
          </p>
          <h2 className="font-extrabold text-lg">
            {logs.length} sesiones
          </h2>
        </header>
        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-[var(--color-muted)]">
              Aún no hay sesiones. Loguea la primera arriba.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {sorted.map((l) => {
              const type = ACTIVITY_TYPES.find((a) => a.value === l.type);
              return (
                <li
                  key={l.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{type?.label ?? l.type}</p>
                    <p className="mono text-[10px] text-[var(--color-muted)] mt-0.5">
                      {l.date} · {l.durationMin} min · Intensidad {l.intensity}/5
                    </p>
                    {l.notes && (
                      <p className="text-xs text-[var(--color-muted)] mt-1">
                        {l.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    className="mono text-[10px] text-[var(--color-dim)] hover:text-[var(--color-red)] transition"
                  >
                    eliminar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mono text-[10px] text-[var(--color-muted)] block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
