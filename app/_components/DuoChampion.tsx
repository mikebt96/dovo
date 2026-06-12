import { getTranslations } from "next-intl/server";
import type { LeaderRow } from "@/lib/actions/leaderboard";
import type { StatKey } from "@/lib/scoring/types";
import { STAT_FROM_LABEL, STAT_BG_CLASS } from "@/lib/leveling/display";
import GameIcon from "./GameIcon";
import CardHalo from "./CardHalo";

// El #1 de la tabla como ancla premium (DESIGN.md §6: card oscura cool + glow
// violeta, número y puntos gigantes). Mismo lenguaje que CharacterCard/DuelScoreboard.
export default async function DuoChampion({
  row,
  isYou,
}: {
  row: LeaderRow;
  isYou: boolean;
}) {
  const t = await getTranslations("leaderboard");
  const top = row.top_stat ? STAT_FROM_LABEL[row.top_stat] : undefined;

  return (
    <div
      className="card-game  relative overflow-hidden p-7 sm:p-9 text-white"
    >
      <CardHalo />

      <div className="relative flex items-center justify-between text-[11px] mono uppercase tracking-[0.22em] text-white/60">
        <span>{t("champion")}</span>
        {isYou && <span className="text-signal-on-game">{t("you")}</span>}
      </div>

      <div className="relative mt-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-end gap-3">
            <span
              className="display font-extrabold leading-[0.8] text-5xl sm:text-6xl tabular-nums text-signal"
              style={{ textShadow: "0 0 40px rgba(109,74,255,0.55)" }}
            >
              1
            </span>
            <div className="min-w-0 pb-1">
              <div className="display font-bold text-2xl sm:text-3xl lowercase truncate">
                {row.nombre_grupo}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] mono uppercase tracking-wider text-white/55">
                {/* panel siempre-oscuro → ámbar brillante fijo, opacidad plena */}
                <span
                  className="flex items-center gap-1 tabular-nums"
                  style={{ color: "var(--game-racha)" }}
                >
                  <GameIcon name="eslabones" size={11} />
                  {t("streak", { n: row.racha_duo })}
                </span>
                {top && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${STAT_BG_CLASS[top]}`}
                    />
                    {row.top_stat}
                  </span>
                )}
              </div>
            </div>
          </div>
          {row.top_clase && (
            <div className="mt-4 text-[11px] mono uppercase tracking-[0.18em] text-white/55">
              {row.top_clase}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div
            className="display font-extrabold tabular-nums text-4xl sm:text-5xl leading-none"
            style={{ textShadow: "0 0 30px rgba(109,74,255,0.45)" }}
          >
            {Math.round(row.puntos_por_miembro)}
          </div>
          <div className="text-[10px] mono uppercase tracking-wider text-white/60 mt-1.5">
            {t("perMember")}
          </div>
        </div>
      </div>
    </div>
  );
}
