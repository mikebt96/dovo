import type { DayState } from "@/lib/utils/streak";

type Day = { fecha: string; state: DayState };

const STATE_COLOR: Record<DayState, string> = {
  cumplido: "bg-ink",
  fallido: "bg-papel-dark border border-ink/20",
  disputado: "bg-amber-400",
  hoy: "bg-papel border-2 border-ink animate-pulse",
  futuro: "bg-papel border border-ink/10 opacity-40",
};

const STATE_LABEL: Record<DayState, string> = {
  cumplido: "cumplido",
  fallido: "fallado",
  disputado: "en disputa",
  hoy: "hoy",
  futuro: "pendiente",
};

export default function StreakGrid({
  days,
  label,
}: {
  days: Day[];
  label: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => (
          <div
            key={d.fecha}
            title={`${d.fecha} · ${STATE_LABEL[d.state]}`}
            className={`w-6 h-6 rounded-sm ${STATE_COLOR[d.state]}`}
          />
        ))}
      </div>
    </div>
  );
}
