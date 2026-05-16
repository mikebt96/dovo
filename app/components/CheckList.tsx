"use client";

import { useEffect, useState } from "react";

type CheckListItem = {
  id: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  meta?: React.ReactNode;
};

/**
 * Carnet checklist — block progress + dashed list rows.
 * El "check" pinta sobreimpresión lima (overprint) sobre la fila marcada,
 * con tipografía tachada y sello opcional. No es un checkbox de UI estándar:
 * intencionalmente parece anotación manual sobre papel.
 */
export default function CheckList({
  storageKey,
  items,
  accent,
  emptyMessage,
}: {
  storageKey: string;
  items: CheckListItem[];
  accent: string;
  emptyMessage?: string;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {}
  }, [checked, storageKey, hydrated]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  if (items.length === 0)
    return (
      <p className="text-sm text-[color:var(--color-ink-mute)] px-5 py-6 italic"
         style={{ fontFamily: "var(--font-stamp)" }}>
        {emptyMessage ?? "Folio sin entradas."}
      </p>
    );

  const doneCount = items.filter((i) => checked[i.id]).length;
  const width = 14;
  const filled = items.length === 0 ? 0 : Math.round((doneCount / items.length) * width);
  const empty = width - filled;

  return (
    <div>
      {/* Block progress header — receipt-style */}
      <div className="px-5 py-3 border-b border-dashed border-[color:var(--color-rule-strong)] flex items-center justify-between gap-4">
        <p className="block-progress flex items-center gap-3 flex-wrap">
          <span aria-hidden="true">
            <span className="fill" style={{ color: accent }}>{"▓".repeat(filled)}</span>
            <span className="text-[color:var(--color-ink-dim)]">{"░".repeat(empty)}</span>
          </span>
        </p>
        <p
          className="mono text-[10px] tabular font-bold tracking-widest"
          style={{ color: accent }}
        >
          {doneCount}/{items.length}
        </p>
      </div>

      <ul className="divide-y divide-dashed divide-[color:var(--color-rule)]">
        {items.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <li key={item.id}>
              <label
                className="flex items-start gap-4 px-5 py-3 cursor-pointer hover:bg-[color:var(--color-paper-2)] transition group"
              >
                {/* Hand-stamped check mark */}
                <span
                  className="mt-1 w-5 h-5 flex items-center justify-center flex-shrink-0 border transition-all"
                  style={{
                    borderColor: isChecked ? accent : "var(--color-rule-strong)",
                    background: isChecked ? accent : "transparent",
                    boxShadow: isChecked ? `1px 1px 0 var(--color-rule-strong)` : "none",
                  }}
                  aria-hidden="true"
                >
                  {isChecked && (
                    <span
                      className="text-[0.7rem] font-black"
                      style={{ color: "#000" }}
                    >
                      ✓
                    </span>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="sr-only"
                />
                <div
                  className={`flex-1 transition-opacity ${
                    isChecked ? "opacity-55" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div
                      className={`flex-1 ${isChecked ? "line-through decoration-[color:var(--color-ink-mute)]" : ""}`}
                    >
                      {item.primary}
                    </div>
                    {item.meta && (
                      <div className="flex-shrink-0">{item.meta}</div>
                    )}
                  </div>
                  {item.secondary && (
                    <div className="mt-1">{item.secondary}</div>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
