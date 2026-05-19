// Funciones puras para bucketing de dimensions hacia pulse.eventos_agregados.
// Buckets alineados con check constraints del schema (Plan 1 migration).
// MVP scope: solo actividad física → todo matchea "fitness" o "otro".

export type Categoria =
  | "fitness"
  | "ahorro"
  | "habitos"
  | "aprendizaje"
  | "relacion"
  | "otro";

// Keywords de actividad física → fitness. Otras categorías existen en el
// schema para futura expansión cuando el scope crezca más allá de físico.
const FITNESS_KEYWORDS = [
  "gym", "pesas", "fuerza", "lift", "barbell", "crossfit",
  "ballet", "danza", "baile", "dance",
  "pilates", "yoga", "mat",
  "corr", "running", "trote", "run", "maraton",
  "cicl", "bici", "cycling", "spinning",
  "nat", "swim", "alberca", "piscina",
  "ejercic", "entren", "deport",
];

export function categorizeGoal(goal: string): Categoria {
  const normalized = goal.toLowerCase();
  if (FITNESS_KEYWORDS.some((w) => normalized.includes(w))) return "fitness";
  return "otro";
}

export type DuracionBucket =
  | "<7d"
  | "7-14d"
  | "14-30d"
  | "30-60d"
  | "60-90d"
  | ">90d";

export function bucketDuracion(dias: number): DuracionBucket {
  if (dias < 7) return "<7d";
  if (dias <= 14) return "7-14d";
  if (dias <= 30) return "14-30d";
  if (dias <= 60) return "30-60d";
  if (dias <= 90) return "60-90d";
  return ">90d";
}

export type TasaBucket = "0-0.2" | "0.2-0.5" | "0.5-0.8" | "0.8-1.0";

// Bucketing por proporción (no porcentaje). Si requeridos=0 caemos en "0-0.2"
// porque significa 0/0 = consideramos no-cumplimiento (defensive default).
export function bucketTasaCumplimiento(
  cumplidos: number,
  requeridos: number,
): TasaBucket {
  if (requeridos <= 0) return "0-0.2";
  const r = cumplidos / requeridos;
  if (r <= 0.2) return "0-0.2";
  if (r <= 0.5) return "0.2-0.5";
  if (r <= 0.8) return "0.5-0.8";
  return "0.8-1.0";
}

// Día de la semana en MX TZ (0=domingo, 6=sábado, formato JavaScript).
export function dowFromDate(iso: string): number {
  const d = new Date(iso);
  const mxDayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[mxDayName] ?? 0;
}
