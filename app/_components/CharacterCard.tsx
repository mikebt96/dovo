import { getTranslations } from "next-intl/server";
import type { StatKey } from "@/lib/scoring/types";
import { barHeight } from "@/lib/leveling/display";

const STATS: { key: StatKey; label: string; bar: string }[] = [
  { key: "fue", label: "FUE", bar: "bg-stat-fue" },
  { key: "res", label: "RES", bar: "bg-stat-res" },
  { key: "flex", label: "FLE", bar: "bg-stat-flex" },
  { key: "vel", label: "VEL", bar: "bg-stat-vel" },
  { key: "equ", label: "EQU", bar: "bg-stat-equ" },
  { key: "vit", label: "VIT", bar: "bg-stat-vit" },
];

// Character card premium (DESIGN.md §6): card oscura cool + glow violeta, nivel gigante,
// clase con el sustantivo en signal, 6 stats color-codeados altos. El ancla de la app.
export default async function CharacterCard({
  nivel,
  className,
  racha,
  prestige,
  stats,
  tiers,
  compact = false,
}: {
  nivel: number;
  className: string;
  racha?: number;
  prestige?: number;
  stats: Record<StatKey, number>;
  tiers: Record<StatKey, { name: string }>;
  compact?: boolean;
}) {
  const t = await getTranslations("perfil");
  const words = className.split(" ");
  const noun = words[words.length - 1];
  const prefix = words.slice(0, -1).join(" ");

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-7 sm:p-9 text-white"
      style={{
        background:
          "radial-gradient(130% 150% at 12% 0%, #16132a 0%, #0b0a14 55%, #07060d 100%)",
        boxShadow: "0 24px 60px -28px rgba(109,74,255,0.55)",
      }}
    >
      {/* grano/halo sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(109,74,255,0.5), transparent 70%)" }}
      />

      <div className="relative flex items-center justify-between text-[11px] mono uppercase tracking-[0.22em] text-white/45">
        <span>{t("eyebrow")}</span>
        {racha !== undefined && (
          <span className="text-signal/90">{racha} sem ✦</span>
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

      <div className="relative mt-8 grid grid-cols-6 gap-2 sm:gap-3">
        {STATS.map((s) => (
          <div key={s.key} className="flex flex-col items-center gap-2">
            <div
              className={`w-full ${compact ? "h-20" : "h-24 sm:h-28"} rounded-xl bg-white/[0.06] relative flex items-end overflow-hidden`}
            >
              <div
                className={`w-full ${s.bar} rounded-t-xl transition-[height] duration-700`}
                style={{ height: `${barHeight(stats[s.key])}%` }}
              />
            </div>
            <span className="text-[10px] mono uppercase tracking-wider text-white/55">
              {s.label}
            </span>
            {!compact && (
              <span className="text-[9px] mono uppercase tracking-wide text-white/30 text-center leading-tight">
                {tiers[s.key]?.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
