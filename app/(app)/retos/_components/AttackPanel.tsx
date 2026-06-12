"use client";

import { prefersReducedMotion, vibrateHit } from "@/lib/juice";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { lanzarAtaque, type AtaqueRow, type AtaqueTipo, type MiembroReto } from "@/lib/actions/ataques";
import { KNOWN_ERROR_CODES } from "@/lib/i18n/action-errors";
import GameIcon from "@/app/_components/GameIcon";

// F10→v2 · Consola de combate (directiva §4.6). El revelado del escudo es la
// única slot machine de dovo — ética porque la moneda se gana entrenando:
//   tap → hit-stop 90ms (silencio) → tensión ≤700ms (wobble) → revelado
//   (shake si conectó, shield-flash si rebotó) + buzz. Nunca >800ms de espera.
// Estados PRE-tap, jamás post-tap: sin munición = botón apagado que enseña a
// cargar; ya atacaste = "se recarga a medianoche". El P0001 del RPC queda como
// red de seguridad, nunca como sorpresa esperada.
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
  const [tension, setTension] = useState(false);
  const [resultado, setResultado] = useState<AtaqueRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // disabled={pending} solo aplica tras re-render: el ref corta el doble-tap en el mismo frame.
  const inflight = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  function lanzar(tipo: AtaqueTipo, paraUser?: string) {
    if (inflight.current) return;
    inflight.current = true;
    setErr(null);
    setPicking(false);
    const reduced = prefersReducedMotion();
    const t0 = Date.now();
    // hit-stop 90ms + tensión: el wobble arranca tras el silencio
    if (!reduced) timers.current.push(setTimeout(() => setTension(true), 90));
    start(async () => {
      try {
        const res = await lanzarAtaque({ retoId, tipo, paraUser });
        if (!res.ok) {
          setTension(false);
          setErr(res.error);
          return;
        }
        // el revelado espera el ciclo de tensión completo (790ms desde el tap),
        // pero jamás más de 800ms — la tensión emociona, la espera frustra (§8.13)
        const wait = reduced ? 0 : Math.max(0, 790 - (Date.now() - t0));
        timers.current.push(
          setTimeout(() => {
            setTension(false);
            setResultado(res.data);
            vibrateHit(res.data.resultado === "bloqueado");
            router.refresh(); // marcador + feed se actualizan con la nueva matemática
          }, wait),
        );
      } catch {
        // Rechazo de transporte (red caída, deploy en vuelo): el ataque PUDO haberse
        // insertado — re-sincroniza en vez de tumbar la vista al error boundary.
        setTension(false);
        setErr(t("atkNetError"));
        router.refresh();
      } finally {
        inflight.current = false;
      }
    });
  }

  // ── Resultado del último ataque (recompensa variable, revelada con tensión) ──
  const banner =
    resultado &&
    (resultado.resultado === "bloqueado" ? (
      <div className="anim-shield-flash rounded-2xl border border-coop/40 px-4 py-3 text-sm flex items-center gap-2"
        style={{ background: "color-mix(in srgb, var(--mode-coop) 10%, transparent)" }}
      >
        <GameIcon name="escudo" size={18} filled className="shrink-0 text-coop-deep" />
        <span>{t("atkBlocked")}</span>
      </div>
    ) : resultado.tipo === "golpe" ? (
      /* TU golpe conectó = evento positivo ⇒ pop, jamás shake (§3: shake SOLO
         impactos recibidos) — F23·G15 */
      <div className="anim-pop rounded-2xl border border-rival/40 px-4 py-3 text-sm relative overflow-visible flex items-center gap-2"
        style={{ background: "color-mix(in srgb, var(--mode-rival) 10%, transparent)" }}
      >
        <GameIcon name="golpe" size={18} filled className="shrink-0 text-rival-deep" />
        <span>{t("atkHitGolpe")}</span>
        <span
          aria-hidden
          className="anim-float-away absolute -top-1 right-4 display font-extrabold text-2xl tabular-nums"
          style={{
            color: "var(--mode-rival)",
            textShadow: "0 0 18px color-mix(in srgb, var(--mode-rival) 50%, transparent)",
          }}
        >
          −10
        </span>
      </div>
    ) : (
      <div className="anim-pop rounded-2xl border border-freeze/40 px-4 py-3 text-sm flex items-center gap-2"
        style={{ background: "color-mix(in srgb, var(--stat-vel) 10%, transparent)" }}
      >
        <GameIcon name="hielo" size={18} className="shrink-0 text-freeze-deep" />
        <span>{t("atkHitFreeze")}</span>
      </div>
    ));

  // ── Estados sin munición / ya usado (resultado es terminal aunque haya err posterior) ──
  if (yaAtacoHoy || resultado) {
    return (
      <div className="space-y-3">
        {banner}
        <p className="flex items-center gap-1.5 text-[10px] mono uppercase tracking-[0.18em] opacity-50">
          <GameIcon name="municion" size={13} />
          {t("atkRecharge")}
        </p>
      </div>
    );
  }

  if (!municion) {
    return (
      <div className="space-y-3">
        {/* el candado que enseña (§8.18): la mecánica bloqueada muestra su requisito */}
        <button
          type="button"
          disabled
          className="btn-game w-full h-[52px] text-white display font-semibold lowercase flex items-center justify-center gap-2"
          style={{ filter: "grayscale(1)", opacity: 0.45 } as React.CSSProperties}
        >
          <GameIcon name="candado" size={18} />
          {t("atkGolpe")}
        </button>
        <p className="flex items-center gap-1.5 text-[10px] mono uppercase tracking-[0.18em] opacity-60">
          <span
            aria-hidden
            className="inline-block w-3.5 h-3.5 rounded-full border border-dashed border-ink/40"
          />
          {t("atkNoAmmo")}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${tension ? "anim-wobble" : ""}`}>
      {banner}
      {/* slot de munición: el recurso como objeto (disco lima, léxico §2) */}
      <p className="flex items-center gap-1.5 text-[10px] mono uppercase tracking-[0.18em]">
        <span style={{ color: "var(--ammo-deep)" }} className="inline-flex">
          <GameIcon name="municion" size={14} filled />
        </span>
        <span className="opacity-70">{t("atkAmmoSlot")}</span>
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => lanzar("golpe")}
          className="btn-game h-[52px] text-white display font-semibold lowercase flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ "--btn-color": "var(--mode-rival)" } as React.CSSProperties}
        >
          <GameIcon name="golpe" size={18} filled />
          {t("atkGolpe")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setPicking((p) => !p)}
          className="btn-game h-[52px] display font-semibold lowercase flex items-center justify-center gap-2 disabled:opacity-60"
          style={
            {
              "--btn-color": "var(--stat-vel)",
              color: "#07060d", // blanco sobre cyan falla AA; tinta sí (≈8:1)
            } as React.CSSProperties
          }
        >
          <GameIcon name="hielo" size={18} />
          {t("atkCongelar")}
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
                className="rounded-full border border-ink/20 px-3 py-1.5 text-sm lowercase hover:border-freeze-deep hover:text-freeze-deep transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <GameIcon name="hielo" size={13} />
                {r.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* código conocido → i18n; lo demás (P0001 del RPC) tal cual — jamás t() con clave desconocida */}
      {err && (
        <p className="text-xs text-rival-deep">
          {KNOWN_ERROR_CODES.has(err) ? t(`err.${err}`) : err}
        </p>
      )}
    </div>
  );
}
