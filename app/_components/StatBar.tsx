// Barra de un stat, color-codeada por los tokens --color-stat-* (globals.css).
// Server component (sin interacción). Las clases bg-stat-* se referencian de forma
// estática en el mapa para que Tailwind no las purgue.
import type { StatKey } from "@/lib/scoring/types";
import { barHeight } from "@/lib/leveling/display";

const BAR_CLASS: Record<StatKey, string> = {
  fue: "bg-stat-fue",
  res: "bg-stat-res",
  flex: "bg-stat-flex",
  vel: "bg-stat-vel",
  equ: "bg-stat-equ",
  vit: "bg-stat-vit",
};

export default function StatBar({
  statKey,
  value,
  orientation = "v",
  label,
}: {
  statKey: StatKey;
  value: number;
  orientation?: "v" | "h";
  label?: string;
}) {
  const pct = barHeight(value);

  if (orientation === "h") {
    return (
      <div className="flex items-center gap-2 w-full">
        {label && (
          <span className="mono text-[10px] uppercase tracking-wider opacity-60 w-9 shrink-0">
            {label}
          </span>
        )}
        <div className="flex-1 h-1.5 bg-papel-dark rounded-full overflow-hidden">
          <div
            className={`h-full ${BAR_CLASS[statKey]} rounded-full transition-[width] duration-500 anim-bar-w`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full h-12 bg-papel-dark rounded-sm relative flex items-end overflow-hidden">
        <div
          className={`w-full ${BAR_CLASS[statKey]} transition-[height] duration-500 anim-bar-h`}
          style={{ height: `${pct}%` }}
        />
      </div>
      {label && (
        <span className="text-[10px] uppercase tracking-wider opacity-60">
          {label}
        </span>
      )}
    </div>
  );
}
