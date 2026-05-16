"use client";

import { useEffect, useState, useTransition } from "react";
import { BigStat, SectionLabel } from "@/app/components/ui";
import { logActivity, removeActivity } from "@/lib/actions/activity";
import type { ProfileId } from "@/lib/types";

type Activity = {
  id: string;            // local: "{timestamp}-{rand}" · server: número como string
  serverId?: number;     // presente si fue persistida; sirve para borrar en DB
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

// Tipos válidos para activity_log.activity_type (debe coincidir con el server schema)
const VALID_ACTIVITY_TYPES = [
  "ballet", "pilates", "running", "swimming",
  "cycling", "yoga", "walk", "other",
] as const;

type ServerActivityType = (typeof VALID_ACTIVITY_TYPES)[number];

function toServerType(t: string): ServerActivityType {
  return (VALID_ACTIVITY_TYPES as readonly string[]).includes(t)
    ? (t as ServerActivityType)
    : "other";
}

export default function ActivityLog({
  storageKey,
  accent,
  primarySport,
  profileId,
}: {
  storageKey: string;
  accent: string;
  primarySport?: string;
  profileId?: ProfileId;  // si falta, queda solo en localStorage (modo v1)
}) {
  const [, startTransition] = useTransition();
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
    const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEntry: Activity = {
      id: localId,
      date: draft.date,
      type: draft.type,
      durationMin: parseInt(draft.durationMin) || 0,
      intensity: parseInt(draft.intensity) || 3,
      notes: draft.notes || undefined,
    };
    // Optimistic: agregar local primero
    setLogs((prev) => [newEntry, ...prev]);
    setDraft((d) => ({ ...d, notes: "" }));

    // Persistir si tenemos profileId; al volver, anotamos el server id
    if (profileId) {
      startTransition(async () => {
        const res = await logActivity({
          profile: profileId,
          date: newEntry.date,
          activity_type: toServerType(newEntry.type),
          duration_min: newEntry.durationMin,
          intensity: newEntry.intensity,
          notes: newEntry.notes,
        });
        if (res.ok) {
          setLogs((prev) =>
            prev.map((l) => (l.id === localId ? { ...l, serverId: res.id } : l)),
          );
        }
      });
    }
  }

  function remove(id: string) {
    const target = logs.find((l) => l.id === id);
    // UI: quitar primero
    setLogs((prev) => prev.filter((l) => l.id !== id));
    // Si está sincronizada con server, borrarla allá también
    if (profileId && target?.serverId) {
      startTransition(async () => {
        await removeActivity({ profile: profileId, id: target.serverId! });
      });
    }
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
    <div className="space-y-12">
      {/* Add form */}
      <section>
        <SectionLabel>Registrar sesión</SectionLabel>
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="Fecha">
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="input-bare input-mono"
              />
            </Field>
            <Field label="Actividad">
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="input-bare"
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
                className="input-bare input-mono"
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
                className="input-bare input-mono"
              />
            </Field>
          </div>
          <Field label="Notas (opcional)">
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="ej: muy intenso, hicimos pliés extra"
              className="input-bare"
            />
          </Field>
          <button
            type="button"
            onClick={add}
            className="btn-ink"
          >
            Registrar →
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-x-8 gap-y-6">
        <BigStat label="Esta semana" value={weekTotal} unit="min" accent={accent} />
        <BigStat label="Total sesiones" value={logs.length} sub="historial completo" />
      </section>

      {/* History */}
      <section>
        <SectionLabel right={`${logs.length} sesiones`}>Historial</SectionLabel>
        {sorted.length === 0 ? (
          <div className="py-12 text-center">
            <p
              className="italic text-[color:var(--color-text-3)] leading-relaxed"
              style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}
            >
              Aún no hay sesiones. Registra la primera arriba.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-divider)] mt-2">
            {sorted.map((l) => {
              const type = ACTIVITY_TYPES.find((a) => a.value === l.type);
              const intense = l.intensity >= 4;
              return (
                <li
                  key={l.id}
                  className="py-4 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm flex items-center gap-2 flex-wrap">
                      <span>{type?.label ?? l.type}</span>
                      {intense && (
                        <span
                          className="mono text-[9px] uppercase tracking-widest"
                          style={{ color: "var(--color-warning)" }}
                        >
                          · intenso
                        </span>
                      )}
                    </p>
                    <p className="mono text-[10px] tabular text-[color:var(--color-text-3)] mt-0.5 tracking-widest">
                      {l.date} · {l.durationMin} min · int {l.intensity}/5
                    </p>
                    {l.notes && (
                      <p className="text-xs text-[color:var(--color-text-3)] mt-1">
                        {l.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] hover:text-[color:var(--color-danger)] transition"
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
      <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
