"use client";

import { useTransition } from "react";
import { revertReplan } from "./actions";
import type { ReplanSummary } from "@/lib/mealsServer";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function triggerLabel(t: string): string {
  if (t === "prefs_changed") return "Cambio de prefs";
  if (t === "manual") return "Manual";
  if (t === "manual_revert") return "Revertido";
  return t;
}

export default function ReplanHistory({
  slug,
  history,
  color,
}: {
  slug: string;
  history: ReplanSummary[];
  color: string;
}) {
  const [isPending, startTransition] = useTransition();
  if (history.length === 0) return null;

  function onRevert() {
    if (!confirm("¿Volver al plan original? Esto deshace los cambios de AI.")) return;
    startTransition(async () => {
      await revertReplan(slug);
    });
  }

  const latest = history[0];
  const isAlreadyReverted = latest.triggeredBy === "manual_revert";

  return (
    <section className="card p-6 space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-ink-mute)]">
            Últimos cambios del AI
          </p>
          <h3 className="font-bold text-base mt-1">
            {isAlreadyReverted
              ? "Plan original activo"
              : `${latest.changeCount} comidas rediseñadas`}
          </h3>
        </div>
        {!isAlreadyReverted && latest.changeCount > 0 && (
          <button
            type="button"
            onClick={onRevert}
            disabled={isPending}
            className="mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition disabled:opacity-50"
            style={{
              borderColor: color,
              color,
            }}
          >
            {isPending ? "Revirtiendo..." : "↻ revertir"}
          </button>
        )}
      </header>

      {latest.changes.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)]">
          {latest.changes.slice(0, 5).map((c, i) => (
            <li key={i} className="py-3">
              <p className="mono text-[10px] text-[color:var(--color-ink-mute)] mb-1">
                {c.originalId}
              </p>
              <p className="font-bold text-sm">{c.newName}</p>
              <p className="text-xs text-[color:var(--color-ink-mute)] mt-1">
                {c.newIngredients}
              </p>
              <p className="mono text-[10px] italic text-[color:var(--color-ink-soft)] mt-1.5">
                {c.reason}
              </p>
            </li>
          ))}
          {latest.changes.length > 5 && (
            <li className="py-2 mono text-[10px] text-[color:var(--color-ink-mute)] text-center">
              + {latest.changes.length - 5} más
            </li>
          )}
        </ul>
      )}

      <footer className="mono text-[10px] text-[color:var(--color-ink-dim)] tracking-widest uppercase pt-2 border-t border-[var(--color-border)]">
        Último: {triggerLabel(latest.triggeredBy)} · {fmtDate(latest.generatedAt)}
        {history.length > 1 && (
          <span> · {history.length} re-plans en total</span>
        )}
      </footer>
    </section>
  );
}
