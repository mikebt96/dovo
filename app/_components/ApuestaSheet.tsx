"use client";

import { vibrateTap } from "@/lib/juice";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { sellarApuesta } from "@/lib/actions/apuestas";
import GameIcon from "./GameIcon";

// Sellar LA APUESTA (el trasfondo de la app): la app PROPONE premios según la
// racha — a más constancia, premios más grandes porque ya se los ganaron —
// pero el texto final SIEMPRE es del dúo (campo libre). El siguiente tier se
// enseña como zanahoria honesta: "a las {n} semanas se desbloquea…".
export default function ApuestaSheet({
  tratoId,
  tierNombre,
  racha,
  sugerenciasPremio,
  sugerenciasApuesta,
  siguienteTier,
  inicial,
}: {
  tratoId: string;
  tierNombre: string;
  racha: number;
  sugerenciasPremio: string[];
  sugerenciasApuesta: string[];
  siguienteTier: { nombre: string; minRacha: number } | null;
  inicial?: { premio: string; apuesta: string } | null;
}) {
  const t = useTranslations("apuesta");
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [premio, setPremio] = useState(inicial?.premio ?? "");
  const [apuesta, setApuesta] = useState(inicial?.apuesta ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function sellar() {
    setErr(null);
    start(async () => {
      const r = await sellarApuesta({ tratoId, premio, apuesta });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      vibrateTap();
      ref.current?.close();
      router.refresh();
    });
  }

  const chip = (activo: boolean) =>
    `rounded-full px-3 py-1.5 text-[11px] mono lowercase border transition-colors ${
      activo
        ? "border-signal bg-signal/10 text-signal"
        : "border-white/20 text-white/75 hover:border-white/45"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="btn-game w-full py-3 text-white display font-semibold lowercase"
        style={{ "--btn-color": "#b8860b" } as React.CSSProperties}
      >
        {inicial ? t("editarCta") : t("sellarCta")}
      </button>

      <dialog
        ref={ref}
        className="dlg-game"
        aria-label={t("sheetTitle")}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="card-game relative overflow-hidden p-6 sm:p-8 text-white">
          <p className="text-[11px] mono uppercase tracking-[0.26em] text-white/50">
            {t("eyebrow")}
          </p>
          <p className="display font-extrabold lowercase text-2xl mt-1">
            {t("sheetTitle")}
          </p>
          <p className="mt-1 text-[11px] mono uppercase tracking-[0.14em]" style={{ color: "#ffb454" }}>
            {t("tierLabel", { tier: tierNombre, n: racha })}
          </p>

          {/* premio conjunto — propuesto por mérito, decidido por el dúo */}
          <div className="mt-5">
            <p className="text-[10px] mono uppercase tracking-[0.18em] text-white/50 mb-2 flex items-center gap-1.5">
              <GameIcon name="premio" size={13} />
              {t("premioLabel")}
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {sugerenciasPremio.map((s) => (
                <button key={s} type="button" onClick={() => setPremio(s)} className={chip(premio === s)}>
                  {s}
                </button>
              ))}
            </div>
            <input
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              placeholder={t("premioPlaceholder")}
              maxLength={140}
              className="w-full bg-transparent border-b border-white/25 pb-1.5 text-sm focus:outline-none focus:border-signal placeholder:text-white/35"
            />
            {siguienteTier && (
              <p className="mt-2 text-[10px] mono lowercase tracking-[0.04em] text-white/40">
                {t("siguienteTier", { n: siguienteTier.minRacha, tier: siguienteTier.nombre })}
              </p>
            )}
          </div>

          {/* la apuesta interna — pica pero no duele */}
          <div className="mt-5">
            <p className="text-[10px] mono uppercase tracking-[0.18em] text-white/50 mb-2 flex items-center gap-1.5">
              <GameIcon name="golpe" size={13} />
              {t("apuestaLabel")}
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {sugerenciasApuesta.map((s) => (
                <button key={s} type="button" onClick={() => setApuesta(s)} className={chip(apuesta === s)}>
                  {s}
                </button>
              ))}
            </div>
            <input
              value={apuesta}
              onChange={(e) => setApuesta(e.target.value)}
              placeholder={t("apuestaPlaceholder")}
              maxLength={140}
              className="w-full bg-transparent border-b border-white/25 pb-1.5 text-sm focus:outline-none focus:border-signal placeholder:text-white/35"
            />
          </div>

          {err && <p className="mt-3 text-xs text-red-300">{err}</p>}

          <button
            type="button"
            disabled={pending || !premio.trim() || !apuesta.trim()}
            onClick={sellar}
            className="btn-game mt-6 w-full py-3 text-white display font-semibold lowercase disabled:opacity-40"
          >
            {pending ? t("sellando") : t("sellarConfirm")}
          </button>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="mt-2 w-full py-2 text-[11px] mono uppercase tracking-[0.16em] text-white/50"
          >
            {t("cerrar")}
          </button>
        </div>
      </dialog>
    </>
  );
}
