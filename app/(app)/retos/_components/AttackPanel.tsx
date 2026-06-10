"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { lanzarAtaque, type AtaqueRow, type AtaqueTipo, type MiembroReto } from "@/lib/actions/ataques";

// F10 · Panel de ataque del duelo. Hook aplicado:
//  · Action 1-tap (golpe) / 2-tap (congelar: picker de miembro rival).
//  · Munición GANADA entrenando: sin check-in de hoy, el CTA te manda a entrenar.
//  · Variable reward: el resultado (impacto/bloqueado por escudo) se revela con animación.
export default function AttackPanel({
  retoId,
  municion,
  yaAtacoHoy,
  rivales,
}: {
  retoId: string;
  municion: boolean;
  yaAtacoHoy: boolean;
  rivales: MiembroReto[];
}) {
  const t = useTranslations("retos");
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [resultado, setResultado] = useState<AtaqueRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function lanzar(tipo: AtaqueTipo, paraUser?: string) {
    setErr(null);
    setPicking(false);
    start(async () => {
      const res = await lanzarAtaque({ retoId, tipo, paraUser });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setResultado(res.data);
      router.refresh(); // marcador + feed se actualizan con la nueva matemática
    });
  }

  // ── Resultado del último ataque (recompensa variable, animada) ──
  const banner =
    resultado &&
    (resultado.resultado === "bloqueado" ? (
      <div className="anim-shield-flash rounded-2xl border border-stat-equ/40 bg-stat-equ/10 px-4 py-3 text-sm">
        🛡️ {t("atkBlocked")}
      </div>
    ) : resultado.tipo === "golpe" ? (
      <div className="anim-shake rounded-2xl border border-signal/40 bg-signal/10 px-4 py-3 text-sm relative overflow-visible">
        💥 {t("atkHitGolpe")}
        <span aria-hidden className="anim-float-away absolute -top-1 right-4 display font-extrabold text-signal">
          −10
        </span>
      </div>
    ) : (
      <div className="anim-pop rounded-2xl border border-stat-vel/40 bg-stat-vel/10 px-4 py-3 text-sm">
        ❄️ {t("atkHitFreeze")}
      </div>
    ));

  // ── Estados sin munición / ya usado ──
  if (yaAtacoHoy || (resultado && !err)) {
    return (
      <div className="space-y-3">
        {banner}
        <p className="text-[10px] mono uppercase tracking-[0.18em] opacity-50">
          {t("atkUsed")}
        </p>
      </div>
    );
  }

  if (!municion) {
    return (
      <p className="text-[10px] mono uppercase tracking-[0.18em] opacity-50">
        🔒 {t("atkNoAmmo")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {banner}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] mono uppercase tracking-[0.18em] text-signal">
          ⚡ {t("atkAmmoReady")}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          disabled={pending}
          onClick={() => lanzar("golpe")}
          className="anim-lift rounded-full bg-signal text-white px-4 py-2 text-[11px] mono uppercase tracking-[0.14em] hover:bg-[#5a37e0] transition-colors disabled:opacity-50"
        >
          🥊 {t("atkGolpe")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setPicking((p) => !p)}
          className="anim-lift rounded-full border border-stat-vel/50 text-stat-vel px-4 py-2 text-[11px] mono uppercase tracking-[0.14em] hover:bg-stat-vel hover:text-white transition-colors disabled:opacity-50"
        >
          ❄️ {t("atkCongelar")}
        </button>
      </div>

      {picking && (
        <div className="anim-pop rounded-2xl border border-ink/15 p-3">
          <p className="text-[10px] mono uppercase tracking-[0.18em] opacity-60 mb-2">
            {t("atkPickRival")}
          </p>
          <div className="flex flex-wrap gap-2">
            {rivales.map((r) => (
              <button
                key={r.user_id}
                type="button"
                disabled={pending}
                onClick={() => lanzar("congelamiento", r.user_id)}
                className="rounded-full border border-ink/20 px-3 py-1.5 text-sm lowercase hover:border-stat-vel hover:text-stat-vel transition-colors disabled:opacity-50"
              >
                ❄️ {r.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {err && <p className="text-xs text-red-600/80">{err}</p>}
    </div>
  );
}
