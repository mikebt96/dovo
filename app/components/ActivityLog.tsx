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
  { value: "ballet",   label: "Ballet",   glyph: "🩰" },
  { value: "pilates",  label: "Pilates",  glyph: "🧘" },
  { value: "running",  label: "Running",  glyph: "🏃" },
  { value: "swimming", label: "Natación", glyph: "🏊" },
  { value: "cycling",  label: "Bici",     glyph: "🚴" },
  { value: "yoga",     label: "Yoga",     glyph: "🧘" },
  { value: "walk",     label: "Caminata", glyph: "🚶" },
  { value: "other",    label: "Otra",     glyph: "🎯" },
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
    <div className="space-y-8">
      {/* Add form — ticket-flat with dashed dividers */}
      <section className="ticket-flat">
        <header className="px-5 py-3 border-b border-dashed border-[color:var(--color-rule-strong)]">
          <p className="mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)]">
            ASIENTO NUEVO · agregar actividad
          </p>
        </header>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Fecha">
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="w-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-strong)] px-2 py-2 text-sm mono tabular focus:outline-none focus:border-[color:var(--color-overprint)] transition"
              />
            </Field>
            <Field label="Actividad">
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-strong)] px-2 py-2 text-sm focus:outline-none focus:border-[color:var(--color-overprint)] transition"
              >
                {ACTIVITY_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.glyph} {a.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duración (min)">
              <input
                type="number"
                inputMode="numeric"
                value={draft.durationMin}
                onChange={(e) => setDraft({ ...draft, durationMin: e.target.value })}
                className="w-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-strong)] px-2 py-2 text-sm mono tabular focus:outline-none focus:border-[color:var(--color-overprint)] transition"
              />
            </Field>
            <Field label="Intensidad (1-5)">
              <input
                type="number"
                min="1"
                max="5"
                value={draft.intensity}
                onChange={(e) => setDraft({ ...draft, intensity: e.target.value })}
                className="w-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-strong)] px-2 py-2 text-sm mono tabular focus:outline-none focus:border-[color:var(--color-overprint)] transition"
              />
            </Field>
          </div>
          <Field label="Notas (opcional)">
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="ej: muy intenso, hicimos pliés extra"
              className="w-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-strong)] px-2 py-2 text-sm focus:outline-none focus:border-[color:var(--color-overprint)] transition"
            />
          </Field>
          <button
            type="button"
            onClick={add}
            className="btn-ink mt-2"
            style={{ background: accent, borderColor: accent, color: "#000" }}
          >
            ⊕ Sellar asiento
          </button>
        </div>
      </section>

      {/* Stats — leader-row pair */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
        <div className="leader-row">
          <span className="label">Esta semana</span>
          <span className="leader" aria-hidden="true" />
          <span className="value tabular" style={{ color: accent }}>
            {weekTotal} min
          </span>
        </div>
        <div className="leader-row">
          <span className="label">Total sesiones</span>
          <span className="leader" aria-hidden="true" />
          <span className="value tabular">{logs.length}</span>
        </div>
      </section>

      {/* History */}
      <section className="ticket-flat overflow-hidden">
        <header className="px-5 py-3 border-b border-dashed border-[color:var(--color-rule-strong)] flex items-baseline justify-between">
          <p className="mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)]">
            HISTORIAL · {logs.length} asientos
          </p>
          <span className="mono text-[10px] tabular text-[color:var(--color-ink-mute)]">
            más reciente arriba
          </span>
        </header>
        {sorted.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p
              className="italic text-[color:var(--color-ink-soft)] leading-relaxed max-w-md mx-auto"
              style={{ fontFamily: "var(--font-stamp)", fontSize: "1rem" }}
            >
              Folio sin entradas. Sella el primer asiento arriba.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-dashed divide-[color:var(--color-rule)]">
            {sorted.map((l) => {
              const type = ACTIVITY_TYPES.find((a) => a.value === l.type);
              return (
                <li key={l.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">
                      <span className="mr-1" aria-hidden="true">{type?.glyph ?? "•"}</span>
                      {type?.label ?? l.type}
                    </p>
                    <p className="mono text-[10px] tabular tracking-wider text-[color:var(--color-ink-mute)] mt-0.5">
                      {l.date} · {l.durationMin} min · int. {l.intensity}/5
                    </p>
                    {l.notes && (
                      <p
                        className="text-xs text-[color:var(--color-ink-soft)] mt-1 italic"
                        style={{ fontFamily: "var(--font-stamp)" }}
                      >
                        “{l.notes}”
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    className="mono text-[10px] tracking-widest text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-overdue)] transition"
                  >
                    × eliminar
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)] block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
