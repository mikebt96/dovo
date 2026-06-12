"use client";

import { vibrateTap } from "@/lib/juice";
import { STAT_SHORT, STAT_VAR } from "@/lib/leveling/display";
import { hoyCDMX } from "@/lib/workout/fecha";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { crearCheckin, type CheckinReward } from "@/lib/actions/checkins";
import { anclarLugar } from "@/lib/actions/lugares";
import type { StatKey } from "@/lib/scoring/types";
import { STAT_KEYS } from "@/lib/scoring/types";
import GameIcon from "./GameIcon";
import LevelUpDialog, { type LevelUpData } from "./LevelUpDialog";

type Coords = { lat: number; lng: number; acc?: number };

// El candado del lugar: UNA muestra en el momento del tap (gesto de usuario ⇒
// prompt de permiso natural). Cualquier fallo (negado, timeout, sin GPS) ⇒
// undefined y el check-in procede SIN sello — jamás bloquea ni castiga.
function getCoords(timeoutMs = 2500): Promise<Coords | undefined> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return resolve(undefined);
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          acc: p.coords.accuracy,
        }),
      () => resolve(undefined),
      { timeout: timeoutMs, maximumAge: 120_000, enableHighAccuracy: false },
    );
  });
}

type Props = {
  miembroId: string;
  actividadId: string;
  nombre: string;
  metricasRequeridas: string[]; // ej ['peso_kg','reps','sets'] | ['tiempo_min','intensidad']
  duracionDefault: number; // de la rutina
  // El expander de métricas crudas solo tiene sentido junto a la sesión (rutina).
  // En la home es ruido: "¿peso/reps/sets de GYM?" no significa nada — el
  // registro real por ejercicio vive en /entrenamiento (feedback de Miguel).
  conMetricas?: boolean;
  // CTA de boost en el momento de máxima motivación (directiva §4.13): tras
  // TU check-in exitoso → "dale energía a tu compa". Link a donde vive el boost.
  boostHref?: string;
};


// Mapa estático por StatKey (Tailwind no puede purgar clases dinámicas — mismo patrón
// estático que DuoChampion). Dot del color del stat + tinte de fondo; el texto va en
// ink (AA sobre papel claro — regla 22: los colores de stat no son texto plano).

// El tap más importante de la app (directiva del consejo §4.1): hit-stop de 90ms
// tras el res.ok y DESPUÉS todo el feedback junto — el recibo de esfuerzo:
// +N pts flotando, chips de delta por stat, etiqueta de boost, háptica. Si hubo
// level-up o tier-up, escala a la ceremonia L (LevelUpDialog) — no apila efectos.
export default function CheckinRow({
  miembroId,
  actividadId,
  nombre,
  metricasRequeridas,
  duracionDefault,
  conMetricas = false,
  boostHref,
}: Props) {
  const t = useTranslations("checkin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [reward, setReward] = useState<CheckinReward | null>(null);
  const [ceremony, setCeremony] = useState<LevelUpData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anclado, setAnclado] = useState<"idle" | "saving" | "done">("idle");
  const [pending, start] = useTransition();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastCoords = useRef<Coords | undefined>(undefined);

  // timers fuera al desmontar (F23·G18): un refresh a mitad del hit-stop no
  // dispara setState sobre un componente muerto
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  function log(metricas: Record<string, number>, duracionMin: number) {
    setError(null);
    start(async () => {
      // la muestra del candado se toma en el tap; el fallo no estorba
      const coords = await getCoords();
      lastCoords.current = coords;
      const res = await crearCheckin({
        miembroId,
        actividadId,
        fecha: hoyCDMX(),
        metricas,
        duracionMin,
        coords,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const r = res.data;
      // ── HIT-STOP 90ms (firma física de dovo §3): la UI se congela tras la
      // respuesta y suelta TODO el feedback junto. Es la diferencia entre
      // "toast de guardado" y golpe que se siente en la mano. ──
      timers.current.push(
        setTimeout(() => {
          setDone(true);
          setReward(r);
          setOpen(false);
          vibrateTap();
          // level-up / tier-up escalan a ceremonia L, encadenada tras el recibo
          if (r.nivelDespues > r.nivelAntes || r.tierUps.length > 0) {
            timers.current.push(
              setTimeout(() => {
                setCeremony({
                  nivel:
                    r.nivelDespues > r.nivelAntes
                      ? { antes: r.nivelAntes, despues: r.nivelDespues }
                      : null,
                  tierUps: r.tierUps,
                  xpParaSiguiente: r.xpParaSiguiente,
                });
              }, 700),
            );
          }
          router.refresh(); // stats + racha + barras (StatBarLive anima old→new)
        }, 90),
      );
    });
  }

  function quickLog() {
    log({}, duracionDefault); // smart default: solo duración de la rutina
  }
  // ancla EXPLÍCITA: el jugador decide que ESTE lugar es su gym (privacidad:
  // la app jamás guarda ubicación que el usuario no pidió anclar)
  function anclar() {
    const c = lastCoords.current;
    if (!c) return;
    setAnclado("saving");
    start(async () => {
      const r = await anclarLugar({ actividadId, lat: c.lat, lng: c.lng });
      setAnclado(r.ok ? "done" : "idle");
    });
  }
  function detailedLog() {
    const metricas: Record<string, number> = {};
    for (const m of metricasRequeridas) metricas[m] = Number(vals[m] ?? 0);
    const dur = metricas.tiempo_min || duracionDefault;
    log(metricas, dur);
  }

  const deltasVisibles = reward
    ? STAT_KEYS.filter((k) => (reward.deltas[k] ?? 0) >= 0.5)
    : [];

  return (
    <div
      className={`relative border rounded-xl p-4 ${done ? "border-signal/40 anim-pop" : "border-ink/15"}`}
    >
      {/* el recibo de esfuerzo: los puntos flotan, escalados por magnitud (Balatro) */}
      {reward && reward.puntos > 0 && (
        <span
          aria-hidden
          className="anim-float-away absolute -top-3 right-6 display font-extrabold text-signal text-2xl tabular-nums"
          style={{
            fontSize: `${Math.min(1.6, 1.1 + reward.puntos / 2000)}rem`,
            textShadow: "0 0 22px color-mix(in srgb, var(--c-signal) 50%, transparent)",
          }}
        >
          +{reward.puntos} pts
        </span>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="display font-medium lowercase">{nombre}</span>
        <div className="flex items-center gap-3 shrink-0">
          {conMetricas && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
            >
              {t("details")}
            </button>
          )}
          <button
            type="button"
            onClick={quickLog}
            disabled={pending || done}
            className="btn-game px-5 py-2.5 rounded-[14px] text-sm lowercase text-white display font-semibold disabled:opacity-100"
          >
            {done ? t("done") : pending ? t("saving") : t("quickLog")}
          </button>
        </div>
      </div>

      {/* chips de delta: qué compró tu sudor, stat por stat, en cascada 60ms */}
      {deltasVisibles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {deltasVisibles.map((k, i) => (
            <span
              key={k}
              className="chip-delta inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-[10px] mono uppercase tracking-[0.12em] tabular-nums"
              style={
                {
                  background: `color-mix(in srgb, ${STAT_VAR[k]} 14%, transparent)`,
                  "--anim-delay": `${i * 60}ms`,
                } as React.CSSProperties
              }
            >
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: STAT_VAR[k] }}
              />
              +{Math.round(reward!.deltas[k])} {STAT_SHORT[k]}
            </span>
          ))}
          {reward?.boostAplicado && (
            <span className="chip-delta inline-flex items-center rounded-[10px] px-2.5 py-1 text-[10px] mono uppercase tracking-[0.12em] text-coop-deep"
              style={
                {
                  background: "color-mix(in srgb, var(--mode-coop) 14%, transparent)",
                  "--anim-delay": `${deltasVisibles.length * 60}ms`,
                } as React.CSSProperties
              }
            >
              {t("boostTag")}
            </span>
          )}
          {/* el candado del lugar: sello ganado, o la invitación a anclar */}
          {reward?.sello && (
            <span
              className="chip-delta inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[10px] mono uppercase tracking-[0.12em] text-coop-deep"
              style={
                {
                  background: "color-mix(in srgb, var(--mode-coop) 14%, transparent)",
                  "--anim-delay": `${(deltasVisibles.length + 1) * 60}ms`,
                } as React.CSSProperties
              }
            >
              <GameIcon name="pin" size={11} filled />
              {t("selloChip")}
            </span>
          )}
          {reward?.puedeAnclar && lastCoords.current && anclado !== "done" && (
            <button
              type="button"
              disabled={anclado === "saving"}
              onClick={anclar}
              className="chip-delta inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[10px] mono uppercase tracking-[0.12em] text-signal-deep border border-signal/40 hover:border-signal transition-colors disabled:opacity-50"
              style={{ "--anim-delay": `${(deltasVisibles.length + 1) * 60}ms` } as React.CSSProperties}
            >
              <GameIcon name="pin" size={11} />
              {anclado === "saving" ? t("anchoring") : t("anchorCta")}
            </button>
          )}
          {anclado === "done" && (
            <span
              className="chip-delta inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[10px] mono uppercase tracking-[0.12em] text-coop-deep"
              style={
                {
                  background: "color-mix(in srgb, var(--mode-coop) 14%, transparent)",
                } as React.CSSProperties
              }
            >
              <GameIcon name="pin" size={11} filled />
              {t("anchored")}
            </span>
          )}
        </div>
      )}

      {/* el ritual cooperativo en el momento de máxima motivación (§4.13):
          independiente de los deltas — con cap diario alcanzado también aplica */}
      {done && boostHref && (
        <div className="mt-2.5">
          <a
            href={boostHref}
            className="chip-delta inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[10px] mono uppercase tracking-[0.12em] text-coop-deep border hover:border-coop transition-colors"
            style={
              {
                borderColor: "color-mix(in srgb, var(--mode-coop) 40%, transparent)",
                "--anim-delay": "240ms",
              } as React.CSSProperties
            }
          >
            <GameIcon name="chispa" size={11} />
            {t("boostCta")}
          </a>
        </div>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {metricasRequeridas.map((m) => (
              <label key={m} className="block">
                <span className="text-[10px] uppercase tracking-wider opacity-60 block mb-1">
                  {t(`metric.${m}`)}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={vals[m] ?? ""}
                  onChange={(e) => setVals((v) => ({ ...v, [m]: e.target.value }))}
                  className="w-full bg-transparent border-b border-ink/40 pb-1 focus:outline-none focus:border-signal"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={detailedLog}
            disabled={pending}
            className="text-xs uppercase tracking-widest underline decoration-signal/40 underline-offset-4 disabled:opacity-50"
          >
            {t("logDetailed")}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-rival-deep mt-2">{error}</p>}

      {ceremony && (
        <LevelUpDialog data={ceremony} onClose={() => setCeremony(null)} />
      )}
    </div>
  );
}
