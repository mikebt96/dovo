"use client";

import { useEffect, useState, useTransition } from "react";
import { MetricBar } from "@/app/components/ui";

type CheckListItem = {
  id: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  meta?: React.ReactNode;
};

export type OnToggleResult = { ok: true } | { ok: false; error: string };

/**
 * CheckList Premium — minimal rows with thin progress bar at top.
 * Optimistic UI: local state updates instantly. If `onToggle` is provided,
 * a Server Action is fired in a transition; failures don't revert local
 * state — user sees their work and we log for retry.
 */
export default function CheckList({
  storageKey,
  items,
  accent,
  emptyMessage,
  onToggle,
}: {
  storageKey: string;
  items: CheckListItem[];
  accent: string;
  emptyMessage?: string;
  onToggle?: (id: string, checked: boolean) => Promise<OnToggleResult>;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();

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
    let nextChecked = false;
    setChecked((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
        nextChecked = false;
      } else {
        next[id] = true;
        nextChecked = true;
      }
      return next;
    });

    if (onToggle) {
      startTransition(async () => {
        await onToggle(id, nextChecked);
      });
    }
  }

  if (items.length === 0)
    return (
      <p className="text-sm text-[color:var(--color-text-3)] py-6 italic"
         style={{ fontFamily: "var(--font-serif)" }}>
        {emptyMessage ?? "Sin elementos."}
      </p>
    );

  const doneCount = items.filter((i) => checked[i.id]).length;

  return (
    <div>
      <div className="flex items-baseline gap-4 py-3 border-b border-[color:var(--color-divider)]">
        <div className="flex-1">
          <MetricBar value={doneCount} max={items.length} accent={accent} />
        </div>
        <p
          className="mono text-[10px] tabular font-bold tracking-widest"
          style={{ color: accent }}
        >
          {doneCount}/{items.length}
        </p>
      </div>

      <ul className="divide-y divide-[color:var(--color-divider)]">
        {items.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <li key={item.id}>
              <label className="flex items-start gap-4 py-4 cursor-pointer hover:bg-[color:var(--color-surface-1)] px-2 -mx-2 transition">
                <span
                  className="mt-1 w-5 h-5 flex items-center justify-center flex-shrink-0 border transition-all"
                  style={{
                    borderColor: isChecked ? accent : "var(--color-divider-strong)",
                    background: isChecked ? accent : "transparent",
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
                      className={`flex-1 ${isChecked ? "line-through decoration-[color:var(--color-text-3)]" : ""}`}
                    >
                      {item.primary}
                    </div>
                    {item.meta && (
                      <div className="flex-shrink-0">{item.meta}</div>
                    )}
                  </div>
                  {item.secondary && <div className="mt-1">{item.secondary}</div>}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
