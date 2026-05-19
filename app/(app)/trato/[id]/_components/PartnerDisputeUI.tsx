"use client";

import { useState, useTransition } from "react";
import { disputeCheckin } from "@/lib/actions/checkins";

type Item = {
  id: string;
  fecha: string;
  nota: string | null;
};

export default function PartnerDisputeUI({
  items,
  partnerName,
}: {
  items: Item[];
  partnerName: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm opacity-60">
        {partnerName} aún no marca check-ins, o todos están en disputa.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <DisputableItem key={it.id} item={it} />
      ))}
    </ul>
  );
}

function DisputableItem({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    if (reason.trim().length < 10) {
      setError("explica brevemente (mínimo 10 caracteres)");
      return;
    }
    start(async () => {
      const res = await disputeCheckin({
        checkin_id: item.id,
        reason: reason.trim(),
      });
      if (!res.ok) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <li className="border-b border-ink/15 pb-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm">
            <span className="mono text-xs opacity-60">{item.fecha}</span>{" "}
            · cumplió
          </p>
          {item.nota && (
            <p className="text-xs opacity-60 mt-0.5">"{item.nota}"</p>
          )}
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 underline"
          >
            disputar
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="por qué disputas (min 10 chars)"
            maxLength={280}
            rows={2}
            className="w-full bg-papel border border-ink/30 p-3 text-sm mb-3 focus:outline-none focus:border-ink resize-none"
          />
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="bg-ink text-papel px-4 py-2 text-xs syne lowercase disabled:opacity-50"
            >
              {pending ? "enviando…" : "confirmar disputa"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setReason("");
                setError(null);
              }}
              className="text-xs opacity-60 px-2"
            >
              cancelar
            </button>
          </div>
          <p className="text-xs opacity-50 mt-2">
            no se puede deshacer. el día queda como disputado.
          </p>
        </div>
      )}
    </li>
  );
}
