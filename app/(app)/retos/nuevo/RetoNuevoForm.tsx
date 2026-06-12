"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { crearReto, type HeadToHead } from "@/lib/actions/retos";
import GameIcon from "@/app/_components/GameIcon";

// Scouting de rivales (directiva §5 retos): cada candidato es una mini-carta —
// clase dominante, top stat en su color, racha del dúo en ámbar y el historial
// contra ti. Eliges a quién retar VIENDO contra quién te metes.
type Candidato = {
  trato_id: string;
  nombre: string;
  racha: number;
  clase: string | null;
  topStat: string | null;
  h2h: HeadToHead;
};

const STAT_VAR: Record<string, string> = {
  fue: "var(--stat-fue)",
  res: "var(--stat-res)",
  flex: "var(--stat-flex)",
  vel: "var(--stat-vel)",
  equ: "var(--stat-equ)",
  vit: "var(--stat-vit)",
};

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
      <ul className="space-y-2 mb-6 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {candidatos.map((c) => {
          const activo = sel === c.trato_id;
          const statColor = c.topStat ? STAT_VAR[c.topStat] : null;
          const conHistoria = c.h2h.yo + c.h2h.rival + c.h2h.empates > 0;
          return (
            <li key={c.trato_id}>
              <button
                type="button"
                onClick={() => setSel(c.trato_id)}
                aria-pressed={activo}
                className={`w-full text-left border rounded-xl p-4 transition-all ${
                  activo
                    ? "border-signal bg-signal/[0.05] shadow-[0_8px_30px_-14px_rgba(109,74,255,0.45)]"
                    : "border-ink/12 hover:border-ink/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="display font-bold lowercase truncate">
                    {c.nombre}
                  </span>
                  {/* racha del dúo rival — SIEMPRE en ámbar (léxico §2) */}
                  {c.racha > 0 && (
                    <span
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] mono uppercase tracking-[0.12em] tabular-nums"
                      style={{ color: "var(--mode-racha)" }}
                    >
                      <GameIcon name="eslabones" size={11} />
                      {t("scoutRacha", { n: c.racha })}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {c.clase && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] mono lowercase opacity-75">
                      {statColor && (
                        <span
                          aria-hidden
                          className="w-2 h-2 rounded-full"
                          style={{ background: statColor }}
                        />
                      )}
                      {c.clase}
                    </span>
                  )}
                  {conHistoria && (
                    <span
                      className="text-[10px] mono uppercase tracking-[0.12em] tabular-nums"
                      style={{ color: "var(--mode-rival-deep)" }}
                    >
                      {t("h2h", { yo: c.h2h.yo, rival: c.h2h.rival })}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {err && <p className="text-sm text-rival-deep mb-3">{err}</p>}

      <button
        type="button"
        disabled={!sel || pending}
        onClick={enviar}
        className="btn-game inline-block text-white px-6 py-3 display font-semibold lowercase disabled:opacity-40"
      >
        {pending ? t("creating") : t("submit")}
      </button>
    </div>
  );
}
