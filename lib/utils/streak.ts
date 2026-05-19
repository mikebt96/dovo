// Cálculo de progreso/streak/cumplimiento. Sin DB, sin deps. Fechas en MX TZ.

export type Frecuencia = "daily" | "weekdays" | "3x_per_week" | "weekly";

const MX_TZ = "America/Mexico_City";

export function toMxDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MX_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function todayMx(): string {
  return toMxDate(new Date());
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function isWeekday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  return dow >= 1 && dow <= 5;
}

export function diasRequeridos(
  frecuencia: Frecuencia,
  duracion_dias: number,
  accepted_at_iso: string,
): number {
  const start = toMxDate(accepted_at_iso);
  switch (frecuencia) {
    case "daily":
      return duracion_dias;
    case "weekdays": {
      let count = 0;
      for (let i = 0; i < duracion_dias; i++) {
        if (isWeekday(addDays(start, i))) count++;
      }
      return count;
    }
    case "3x_per_week":
      return Math.ceil(duracion_dias / 7) * 3;
    case "weekly":
      return Math.ceil(duracion_dias / 7);
  }
}

export type DayState = "cumplido" | "fallido" | "disputado" | "hoy" | "futuro";

export type CheckinRow = {
  fecha: string;
  cumplido: boolean;
  disputed_at: string | null;
};

export function dayStates(
  accepted_at_iso: string,
  duracion_dias: number,
  checkins: CheckinRow[],
  today: string = todayMx(),
): { fecha: string; state: DayState }[] {
  const start = toMxDate(accepted_at_iso);
  const byDate = new Map(checkins.map((c) => [c.fecha, c]));

  return Array.from({ length: duracion_dias }, (_, i) => {
    const fecha = addDays(start, i);
    const checkin = byDate.get(fecha);
    let state: DayState;
    if (fecha > today) state = "futuro";
    else if (fecha === today && !checkin) state = "hoy";
    else if (checkin?.disputed_at) state = "disputado";
    else if (checkin?.cumplido) state = "cumplido";
    else state = "fallido";
    return { fecha, state };
  });
}

export function streakActual(states: { state: DayState }[]): number {
  let streak = 0;
  for (let i = states.length - 1; i >= 0; i--) {
    const s = states[i].state;
    if (s === "futuro" || s === "hoy") continue;
    if (s === "cumplido") streak++;
    else break;
  }
  return streak;
}

export function countCumplidos(states: { state: DayState }[]): number {
  return states.filter((s) => s.state === "cumplido").length;
}

export function hasDisputes(states: { state: DayState }[]): boolean {
  return states.some((s) => s.state === "disputado");
}

// Día del trato que termina al cumplirse duracion_dias completos desde accepted_at.
// Una vez today > endDate (no inclusive), el trato puede ser resuelto.
export function endDateMx(accepted_at_iso: string, duracion_dias: number): string {
  const start = toMxDate(accepted_at_iso);
  return addDays(start, duracion_dias);
}

export function isPastDuration(
  accepted_at_iso: string,
  duracion_dias: number,
  today: string = todayMx(),
): boolean {
  return today >= endDateMx(accepted_at_iso, duracion_dias);
}
