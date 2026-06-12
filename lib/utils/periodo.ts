// Ventanas de tiempo para el leaderboard / retos. Half-open [start, end).
// ANCLADAS A CDMX (F23·G17): la versión UTC marcaba "semana nueva" desde las
// 18:00 del domingo CDMX — el leaderboard y el plan apuntaban a semanas
// distintas según la hora. Semana = lunes CDMX (igual que los crons).
import { hoyCDMX, lunesSemanaCDMX } from "@/lib/workout/fecha";

export type Periodo = "semana" | "mes";

// Rango {start, end} en 'YYYY-MM-DD' para el periodo dado (CDMX).
export function periodoRange(periodo: Periodo): { start: string; end: string } {
  if (periodo === "mes") {
    const ym = hoyCDMX().slice(0, 7); // YYYY-MM en CDMX
    const start = `${ym}-01`;
    const d = new Date(start + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + 1);
    return { start, end: d.toISOString().slice(0, 10) };
  }
  return { start: lunesSemanaCDMX(0), end: lunesSemanaCDMX(1) };
}
