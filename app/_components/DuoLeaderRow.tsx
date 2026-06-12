import { getTranslations } from "next-intl/server";
import type { LeaderRow } from "@/lib/actions/leaderboard";
import type { StatKey } from "@/lib/scoring/types";
import { STAT_FROM_LABEL, STAT_BG_CLASS } from "@/lib/leveling/display";
import GameIcon from "./GameIcon";

export default async function DuoLeaderRow({
  row,
  isYou,
}: {
  row: LeaderRow;
  isYou: boolean;
}) {
  const t = await getTranslations("leaderboard");
  const top = row.top_stat ? STAT_FROM_LABEL[row.top_stat] : undefined;
  const podium = row.posicion <= 3;

  return (
    <li
      className={`group flex items-center gap-3 sm:gap-4 rounded-xl border p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 ${
        isYou
          ? "border-signal bg-signal/[0.04]"
          : podium
            ? "border-ink/15 bg-papel-dark/40"
            : "border-ink/10 hover:border-ink/25"
      }`}
    >
      <span
        className={`display font-extrabold tabular-nums text-2xl w-8 sm:w-9 text-center shrink-0 ${
          podium ? "text-ink/80" : "text-ink/60"
        }`}
      >
        {row.posicion}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="display font-semibold lowercase truncate">
            {row.nombre_grupo}
          </span>
          {isYou && (
            <span className="text-[10px] mono uppercase tracking-widest text-signal shrink-0">
              {t("you")}
            </span>
          )}
        </div>
        {/* racha ámbar a opacidad plena (léxico §2); el resto se atenúa */}
        <div className="flex items-center gap-3 mt-1 text-[11px] mono uppercase tracking-wider">
          <span
            className="flex items-center gap-1 tabular-nums"
            style={{ color: "var(--mode-racha)" }}
          >
            <GameIcon name="eslabones" size={11} />
            {t("streak", { n: row.racha_duo })}
          </span>
          {top && (
            <span className="flex items-center gap-1.5 opacity-70">
              <span className={`inline-block w-2 h-2 rounded-full ${STAT_BG_CLASS[top]}`} />
              {row.top_stat}
            </span>
          )}
          {row.top_clase && (
            <span className="truncate hidden sm:inline opacity-70">{row.top_clase}</span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="display font-extrabold tabular-nums text-xl leading-none">
          {Math.round(row.puntos_por_miembro)}
        </div>
        <div className="text-[10px] mono uppercase tracking-wider opacity-70 mt-1">
          {t("perMember")}
        </div>
      </div>
    </li>
  );
}
