import { getTranslations } from "next-intl/server";
import type { StatKey } from "@/lib/scoring/types";
import { barHeight } from "@/lib/leveling/display";
import { statDisplay } from "@/lib/leveling";
import StatBarLive from "./StatBarLive";

const STATS: { key: StatKey; label: string; colorVar: string }[] = [
  { key: "fue", label: "FUE", colorVar: "var(--stat-fue)" },
  { key: "res", label: "RES", colorVar: "var(--stat-res)" },
  { key: "flex", label: "FLE", colorVar: "var(--stat-flex)" },
  { key: "vel", label: "VEL", colorVar: "var(--stat-vel)" },
  { key: "equ", label: "EQU", colorVar: "var(--stat-equ)" },
  { key: "vit", label: "VIT", colorVar: "var(--stat-vit)" },
];

// Character card v2 (directiva del consejo §4.11): la carta del personaje.
// Server component (shell) con islands de cliente para lo que se mueve:
// barras de dos capas (StatBarLive — ghost al llegar deltas) y XP del nivel
// EN LA HOME. Racha personal en ámbar (--color-racha, léxico §2). El nivel
// gigante entra con pop (F12). Superficie = .card-game (token, no inline).
export default async function CharacterCard({
  nivel,
  className,
  racha,
  prestige,
  stats,
  tiers,
  progresoNivel,
  xpParaSiguiente,
  compact = false,
}: {
  nivel: number;
  className: string;
  racha?: number;
  prestige?: number;
  stats: Record<StatKey, number>;
  tiers: Record<StatKey, { name: string }>;
  progresoNivel?: number; // 0..1 — presente ⇒ barra de XP de dos capas
  xpParaSiguiente?: number;
  compact?: boolean;
}) {
  const t = await getTranslations("perfil");
  const words = className.split(" ");
  const noun = words[words.length - 1];
  const prefix = words.slice(0, -1).join(" ");

  return (
    <div className="card-game relative overflow-hidden p-7 sm:p-9 text-white">
      {/* grano/halo sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(109,74,255,0.5), transparent 70%)" }}
      />

      <div className="relative flex items-center justify-between text-[11px] mono uppercase tracking-[0.22em] text-white/45">
        <span>{t("eyebrow")}</span>
        {racha !== undefined && (
          /* card siempre oscura → ámbar brillante fijo, no el token reactivo */
          <span className="tabular-nums" style={{ color: "#ffb454" }}>
            {t("yourStreak", { n: racha })}
          </span>
        )}
      </div>

      <div className="relative mt-6 flex items-end gap-4">
        {/* El nivel ENTRA como en un juego (pop) — F12. */}
        <div
          className="anim-pop display font-extrabold leading-[0.8] text-6xl sm:text-7xl tabular-nums"
          style={{ textShadow: "0 0 44px rgba(109,74,255,0.45)" }}
        >
          {nivel}
        </div>
        <div className="pb-1.5">
          <div className="text-[10px] mono uppercase tracking-[0.22em] text-white/40 mb-1">
            {prestige ? `nivel · prestige ${prestige}` : "nivel"}
          </div>
          <div className="display font-bold text-xl sm:text-2xl lowercase leading-none">
            {prefix && <span className="text-white/90">{prefix} </span>}
            <span className="text-signal">{noun}</span>
          </div>
        </div>
      </div>

      {/* Barra de XP de dos capas — la barra fantasma (signature move §6.3).
          Vive EN LA HOME, no enterrada en /perfil. */}
      {progresoNivel !== undefined && (
        <div className="relative mt-6">
          <div className="flex items-center justify-between text-[10px] mono uppercase tracking-[0.18em] text-white/40 mb-1.5">
            <span>xp</span>
            {xpParaSiguiente !== undefined && (
              <span className="tabular-nums">
                {t("xpToNext", { xp: xpParaSiguiente, n: nivel + 1 })}
              </span>
            )}
          </div>
          <StatBarLive
            pct={progresoNivel * 100}
            color="var(--c-signal)"
            className="h-2 rounded-full"
            trackClass="bg-white/[0.08]"
            ariaLabel="xp"
          />
        </div>
      )}

      <div className="relative mt-8 grid grid-cols-6 gap-2 sm:gap-3">
        {STATS.map((s) => (
          <div key={s.key} className="flex flex-col items-center gap-2">
            <div
              className={`w-full ${compact ? "h-20" : "h-24 sm:h-28"} rounded-xl overflow-hidden`}
            >
              <StatBarLive
                pct={barHeight(stats[s.key])}
                color={s.colorVar}
                orientation="v"
                className="w-full h-full"
                trackClass="bg-white/[0.06]"
                ariaLabel={s.label}
              />
            </div>
            <span className="text-[10px] mono uppercase tracking-wider text-white/55 tabular-nums">
              {s.label} {statDisplay(stats[s.key])}
            </span>
            {!compact && (
              <span className="text-[9px] mono uppercase tracking-wide text-white/45 text-center leading-tight">
                {tiers[s.key]?.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
