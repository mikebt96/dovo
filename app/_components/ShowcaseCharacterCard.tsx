import { getTranslations } from "next-intl/server";
import type { DemoRow } from "@/lib/actions/leaderboard";
import type { StatKey } from "@/lib/scoring/types";
import { STAT_FROM_LABEL, STAT_TEXT_CLASS } from "@/lib/leveling/display";

// Tarjeta oscura on-brand de un dúo destacado. Diseñada para screenshot (share).
export default async function ShowcaseCharacterCard({ row }: { row: DemoRow }) {
  const t = await getTranslations("showcase");
  const top = row.top_stat ? STAT_FROM_LABEL[row.top_stat] : undefined;

  return (
    <div
      className="relative overflow-hidden rounded-[20px] p-6 text-white min-h-[280px] flex flex-col"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, var(--night-1) 0%, var(--night-2) 60%, #07060d 100%)",
      }}
    >
      <div className="flex items-center justify-between text-[11px] mono uppercase tracking-widest text-white/50">
        <span className="syne lowercase text-white/80">dovo</span>
        <span>{t("rank", { n: row.posicion })}</span>
      </div>

      <div className="mt-8">
        <div
          className="display font-extrabold tabular-nums text-5xl leading-none"
          style={{ textShadow: "0 0 30px rgba(109,74,255,0.5)" }}
        >
          {Math.round(row.puntos_por_miembro)}
        </div>
        <div className="text-[11px] mono uppercase tracking-widest text-white/50 mt-2">
          {t("perMember")}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="display font-semibold lowercase text-lg">
          {row.nombre_grupo}
        </div>
        {row.top_clase && (
          <div className="text-sm text-white/70 mt-0.5">{row.top_clase}</div>
        )}
        <div className="flex items-center gap-4 mt-3 text-[11px] mono uppercase tracking-wider text-white/60">
          <span>{t("streak", { n: row.racha_duo })}</span>
          {top && (
            <span className={`flex items-center gap-1.5 ${STAT_TEXT_CLASS[top]}`}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "currentColor" }}
              />
              {row.top_stat}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
