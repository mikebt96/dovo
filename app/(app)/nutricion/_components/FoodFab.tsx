"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FoodLogQuickAdd from "./FoodLogQuickAdd";

// FAB flotante de logging (F5 UX fix): el "+" aparece sticky bottom-right en el scroll.
// Al tocar despliega el quick-add inline (no modal — menos fricción, misma animación).
// Solo en mobile (en desktop el form inline es accesible sin scroll).
export default function FoodFab({
  logs,
}: {
  logs: Array<{ id: string; tipo: string; descripcion: string }>;
}) {
  const t = useTranslations("nutricion");
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("logTitle")}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-signal text-white shadow-[0_8px_30px_-4px_rgba(109,74,255,0.6)] flex items-center justify-center text-2xl hover:bg-[#5a37e0] transition-all hover:scale-105 active:scale-95 lg:hidden"
      >
        <span
          style={{ transition: "transform 0.2s", transform: open ? "rotate(45deg)" : undefined }}
        >
          +
        </span>
      </button>

      {/* Panel deslizante (solo mobile) */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 rounded-t-3xl bg-papel border-t border-ink/15 px-6 pt-5 pb-8 shadow-[0_-24px_60px_-16px_rgba(0,0,0,0.18)] lg:hidden"
          role="dialog"
          aria-label={t("logTitle")}
        >
          <div className="w-10 h-1 rounded-full bg-ink/15 mx-auto mb-4" />
          <h3 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
            {t("logTitle")}
          </h3>
          <FoodLogQuickAdd logs={logs} />
        </div>
      )}
      {open && (
        <button
          type="button"
          aria-label="cerrar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 lg:hidden bg-transparent cursor-default"
        />
      )}
    </>
  );
}
