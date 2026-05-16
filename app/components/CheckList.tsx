"use client";

import { useEffect, useState } from "react";

type CheckListItem = {
  id: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  meta?: React.ReactNode;
};

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
      <p className="text-sm text-[var(--color-muted)] px-5 py-6">
        {emptyMessage ?? "Nada por aquí."}
      </p>
    );

  const doneCount = items.filter((i) => checked[i.id]).length;
  const pct =
    items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);

  return (
    <div>
      <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="h-1.5 bg-[var(--color-card-2)] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${pct}%`,
                background: accent,
              }}
            />
          </div>
        </div>
        <p
          className="mono text-[10px] font-bold"
          style={{ color: accent }}
        >
          {doneCount}/{items.length}
        </p>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {items.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <li key={item.id}>
              <label
                className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-[var(--color-card-2)] transition"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-[var(--color-border)] cursor-pointer flex-shrink-0 appearance-none checked:border-current relative"
                  style={
                    isChecked
                      ? {
                          // @ts-expect-error -- custom prop for ::after color
                          "--accent": accent,
                          background: accent,
                          borderColor: accent,
                        }
                      : undefined
                  }
                />
                <div
                  className={`flex-1 transition-opacity ${
                    isChecked ? "opacity-50 line-through" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex-1">{item.primary}</div>
                    {item.meta && <div className="flex-shrink-0">{item.meta}</div>}
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
