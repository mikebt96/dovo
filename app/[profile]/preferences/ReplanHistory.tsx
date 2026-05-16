"use client";

import { useState, useTransition } from "react";
import { revertReplan, triggerReplan } from "./actions";
import type { ReplanSummary } from "@/lib/mealsServer";
import { SectionLabel } from "@/app/components/ui";

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
  const [notice, setNotice] = useState<string | null>(null);

  function onRevert() {
    if (!confirm("¿Volver al plan original? Esto deshace los cambios de AI.")) return;
    startTransition(async () => {
      await revertReplan(slug);
      setNotice("Plan original restaurado.");
    });
  }

  function onRegenerate() {
    setNotice("Pidiendo al AI un re-plan nuevo...");
    startTransition(async () => {
      const res = await triggerReplan(slug);
      if (res.ok) {
        setNotice(
          res.changes === 0
            ? "AI dice que el plan actual ya cumple tus prefs."
            : `Plan rediseñado · ${res.changes} comidas actualizadas.`
        );
      } else {
        setNotice(`Falló: ${res.error}`);
      }
    });
  }

  if (history.length === 0) {
    return (
      <section>
        <SectionLabel right="sin movimientos">AI re-plan</SectionLabel>
        <div className="mt-5 space-y-4">
          <p
            className="italic text-[color:var(--color-text-2)] leading-relaxed"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}
          >
            Cuando guardes prefs, la AI rediseña meals automáticamente. O
            fuérzalo manualmente:
          </p>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isPending}
            className="btn-ghost disabled:opacity-50"
            style={{ borderColor: color, color }}
          >
            {isPending ? "Generando..." : "Regenerar ahora →"}
          </button>
          {notice && (
            <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-2)]">
              {notice}
            </p>
          )}
        </div>
      </section>
    );
  }

  const latest = history[0];
  const isAlreadyReverted = latest.triggeredBy === "manual_revert";

  return (
    <section>
      <SectionLabel
        right={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isPending}
              className="btn-ghost disabled:opacity-50"
              style={{ borderColor: color, color }}
            >
              {isPending ? "..." : "Regenerar"}
            </button>
            {!isAlreadyReverted && latest.changeCount > 0 && (
              <button
                type="button"
                onClick={onRevert}
                disabled={isPending}
                className="btn-ghost disabled:opacity-50"
              >
                Revertir
              </button>
            )}
          </div>
        }
      >
        AI re-plan
        <span className="ml-3 mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
          {isAlreadyReverted
            ? "plan original activo"
            : `${latest.changeCount} comidas rediseñadas`}
        </span>
      </SectionLabel>

      <div className="mt-5">
        {notice && (
          <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-2)] mb-4">
            {notice}
          </p>
        )}

        {latest.changes.length > 0 && (
          <ul className="divide-y divide-[color:var(--color-divider)]">
            {latest.changes.slice(0, 5).map((c, i) => (
              <li key={i} className="py-4">
                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                  <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
                    {c.originalId}
                  </p>
                  <MacroDelta change={c} />
                </div>
                {c.originalName && c.originalName !== c.newName && (
                  <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] mb-1 line-through">
                    {c.originalName}
                  </p>
                )}
                <p className="font-bold text-sm">{c.newName}</p>
                <p className="text-xs text-[color:var(--color-text-3)] mt-1 leading-relaxed">
                  {c.newIngredients}
                </p>
                <p
                  className="italic text-xs text-[color:var(--color-text-2)] mt-2 leading-relaxed"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem" }}
                >
                  “{c.reason}”
                </p>
              </li>
            ))}
            {latest.changes.length > 5 && (
              <li className="py-3 mono text-[10px] tracking-widest text-[color:var(--color-text-3)] text-center">
                + {latest.changes.length - 5} más
              </li>
            )}
          </ul>
        )}

        <div className="mt-4 pt-3 border-t border-[color:var(--color-divider)] flex items-center gap-3 flex-wrap">
          <span
            className="mono text-[10px] uppercase tracking-widest"
            style={{
              color: isAlreadyReverted
                ? "var(--color-warning)"
                : "var(--color-success)",
            }}
          >
            {triggerLabel(latest.triggeredBy)}
          </span>
          <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] tabular">
            {fmtDate(latest.generatedAt)}
          </span>
          {history.length > 1 && (
            <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)]">
              · {history.length} re-plans totales
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
