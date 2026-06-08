import { getTranslations } from "next-intl/server";
import type { LeaderRow } from "@/lib/actions/leaderboard";
import type { StatKey } from "@/lib/scoring/types";

const STAT_FROM_LABEL: Record<string, StatKey> = {
  FUE: "fue",
  RES: "res",
  FLEX: "flex",
  VEL: "vel",
  EQU: "equ",
  VIT: "vit",
};

// Punto color-codeado del stat top (clases estáticas para que Tailwind no las purgue).
const STAT_DOT: Record<StatKey, string> = {
  fue: "bg-stat-fue",
  res: "bg-stat-res",
  flex: "bg-stat-flex",
  vel: "bg-stat-vel",
  equ: "bg-stat-equ",
  vit: "bg-stat-vit",
};

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
  const isFirst = row.posicion === 1;

  return (
    <li
      className={`flex items-center gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 transition-colors ${
        isYou ? "border-signal" : "border-ink/12"
      } ${podium ? "bg-papel-dark/40" : ""}`}
    >
      <span
        className={`display font-extrabold tabular-nums text-xl w-7 sm:w-8 text-center shrink-0 ${
          isFirst ? "text-signal" : "opacity-50"
        }`}
        style={isFirst ? { textShadow: "0 0 24px rgba(109,74,255,0.45)" } : undefined}
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
        <div className="flex items-center gap-3 mt-1 text-[11px] mono uppercase tracking-wider opacity-60">
          <span>{t("streak", { n: row.racha_duo })}</span>
          {top && (
            <span className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${STAT_DOT[top]}`} />
              {row.top_stat}
            </span>
          )}
          {row.top_clase && (
            <span className="truncate hidden sm:inline">{row.top_clase}</span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="display font-extrabold tabular-nums text-xl leading-none">
          {Math.round(row.puntos_por_miembro)}
        </div>
        <div className="text-[10px] mono uppercase tracking-wider opacity-50 mt-1">
          {t("perMember")}
        </div>
      </div>
    </li>
  );
}
