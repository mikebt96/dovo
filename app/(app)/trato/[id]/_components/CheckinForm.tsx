"use client";

import { useState, useTransition } from "react";
import { createCheckin } from "@/lib/actions/checkins";

export default function CheckinForm({
  tratoId,
  existing,
}: {
  tratoId: string;
  existing?: { cumplido: boolean; nota: string | null } | null;
}) {
  const [cumplido, setCumplido] = useState<boolean>(existing?.cumplido ?? true);
  const [nota, setNota] = useState<string>(existing?.nota ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function submit() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await createCheckin({
        trato_id: tratoId,
        cumplido,
        nota: nota || undefined,
      });
      if (!res.ok) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div className="border border-ink p-5">
      <p className="text-xs uppercase tracking-widest opacity-60 mb-4">
        {existing ? "tu check-in de hoy (puedes editarlo hasta las 23:59)" : "tu check-in de hoy"}
      </p>

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setCumplido(true)}
          className={`flex-1 py-3 syne lowercase ${
            cumplido
              ? "bg-ink text-papel"
              : "border border-ink/30 text-ink/60"
          }`}
        >
          cumplí
        </button>
        <button
          type="button"
          onClick={() => setCumplido(false)}
          className={`flex-1 py-3 syne lowercase ${
            !cumplido
              ? "bg-ink text-papel"
              : "border border-ink/30 text-ink/60"
          }`}
        >
          fallé
        </button>
      </div>

      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="nota corta (opcional, max 280)"
        maxLength={280}
        rows={2}
        className="w-full bg-papel border border-ink/30 p-3 text-sm mb-4 focus:outline-none focus:border-ink resize-none"
      />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {saved && !error && (
        <p className="text-sm opacity-70 mb-3">guardado.</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "guardando…" : existing ? "actualizar" : "guardar check-in"}
      </button>
    </div>
  );
}
