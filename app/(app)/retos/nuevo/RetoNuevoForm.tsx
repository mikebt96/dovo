"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { crearReto } from "@/lib/actions/retos";

type Candidato = { trato_id: string; nombre: string };

export default function RetoNuevoForm({
  miTratoId,
  candidatos,
}: {
  miTratoId: string;
  candidatos: Candidato[];
}) {
  const t = useTranslations("retos");
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function enviar() {
    if (!sel) return;
    setErr(null);
    start(async () => {
      const r = await crearReto({ miTratoId, rivalTratoId: sel });
      if (r.ok) router.push("/retos");
      else setErr(r.error);
    });
  }

  if (candidatos.length === 0) {
    return (
      <div className="border border-ink/12 rounded-lg p-6 text-sm opacity-70">
        {t("pickRivalHint")}
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
        {t("pickRival")}
      </p>
      <ul className="space-y-2 mb-6">
        {candidatos.map((c) => (
          <li key={c.trato_id}>
            <button
              type="button"
              onClick={() => setSel(c.trato_id)}
              className={`w-full text-left border rounded-lg p-4 transition-colors ${
                sel === c.trato_id
                  ? "border-signal bg-papel-dark/40"
                  : "border-ink/12 hover:border-ink/30"
              }`}
            >
              <span className="display font-medium lowercase">{c.nombre}</span>
            </button>
          </li>
        ))}
      </ul>

      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

      <button
        type="button"
        disabled={!sel || pending}
        onClick={enviar}
        className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors disabled:opacity-40"
      >
        {pending ? t("creating") : t("submit")}
      </button>
    </div>
  );
}
