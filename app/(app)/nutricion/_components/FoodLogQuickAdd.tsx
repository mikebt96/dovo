"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { logFood, removeFoodLog } from "@/lib/actions/nutrition";

// Logging diario rápido (funciona SIEMPRE, con o sin IA): tipo + texto + agregar.
export default function FoodLogQuickAdd({
  logs,
}: {
  logs: Array<{ id: string; tipo: string; descripcion: string }>;
}) {
  const t = useTranslations("nutricion");
  const [tipo, setTipo] = useState("comida");
  const [texto, setTexto] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await logFood({ tipo, descripcion: texto });
      if (res.ok) setTexto("");
      else setErr(res.error);
    });
  }

  return (
    <div>
      {logs.length > 0 && (
        <ul className="space-y-2 mb-4">
          {logs.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-3 rounded-xl border border-ink/10 px-4 py-3"
            >
              <span className="text-[10px] mono uppercase tracking-widest text-signal shrink-0 w-20">
                {t(`tipo.${l.tipo}`)}
              </span>
              <span className="text-sm flex-1 min-w-0 truncate">{l.descripcion}</span>
              <button
                type="button"
                aria-label={t("logRemove")}
                onClick={() => startTransition(async () => void (await removeFoodLog(l.id)))}
                className="opacity-40 hover:opacity-100 hover:text-signal transition-opacity text-sm"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          aria-label={t("logTipo")}
          className="rounded-xl border border-ink/15 bg-transparent px-3 py-3 text-xs mono uppercase tracking-wider focus:border-signal focus:outline-none"
        >
          {["desayuno", "comida", "cena", "snack"].map((tp) => (
            <option key={tp} value={tp}>
              {t(`tipo.${tp}`)}
            </option>
          ))}
        </select>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t("logPlaceholder")}
          maxLength={200}
          className="flex-1 rounded-xl border border-ink/15 bg-transparent px-4 py-3 text-sm focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !texto.trim()}
          className="rounded-full bg-ink text-papel px-5 py-3 display font-semibold lowercase hover:bg-signal hover:text-white transition-colors disabled:opacity-50"
        >
          +
        </button>
      </form>
      {err && (
        <p className="text-xs mono uppercase tracking-wider text-red-600/80 mt-2">{err}</p>
      )}
    </div>
  );
}
