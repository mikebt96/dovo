// Ventanas de tiempo para el leaderboard / retos. Half-open [start, end).
// Semana = lunes ISO (igual que date_trunc('week') en Postgres). Mes = primer día.

export type Periodo = "semana" | "mes";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Lunes de la semana ISO que contiene `ref` (UTC).
export function isoWeekStart(ref: Date = new Date()): Date {
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const dow = d.getUTCDay(); // 0=domingo..6=sábado
  const back = dow === 0 ? -6 : 1 - dow; // retrocede al lunes
  d.setUTCDate(d.getUTCDate() + back);
  return d;
}

export function monthStart(ref: Date = new Date()): Date {
  return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
}

// Rango {start, end} en 'YYYY-MM-DD' para el periodo dado.
export function periodoRange(periodo: Periodo, ref: Date = new Date()): { start: string; end: string } {
  if (periodo === "mes") {
    const start = monthStart(ref);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { start: iso(start), end: iso(end) };
  }
  const start = isoWeekStart(ref);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start: iso(start), end: iso(end) };
}
