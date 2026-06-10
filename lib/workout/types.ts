// F9 · Tipos del plan de entrenamiento prescrito. El plan vive como jsonb en
// core.workout_plans (igual que MealPlanContent en F5): embebe slug + nombre para
// renderizar sin joins; el slug es la identidad estable para logs/progresión.

export type { PerfilFisico } from "@/lib/nutrition/types";

export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

/** Un ejercicio prescrito dentro de un día (bloque). */
export type Bloque = {
  exercise_slug: string; // identidad estable → catálogo + exercise_logs
  nombre: string;        // display, es-MX
  series: number;        // 1-6
  reps: string;          // "8-12", "12-15", "6×400m", "30 min" — texto corto
  descanso_seg: number;  // 0 para cardio continuo
  nota?: string;         // técnica/intención ("pausa abajo", "ritmo conversacional")
};

/** Un día del plan: una sesión de una disciplina con sus bloques. */
export type DiaPlan = {
  dia: DiaSemana;
  actividad_slug: string; // gym | running | pilates | ballet (catálogo core.actividades)
  titulo: string;         // "empuje + core", "intervalos", "full body A"
  bloques: Bloque[];
};

export type WorkoutPlanContent = {
  dias: DiaPlan[]; // SOLO días con sesión (no 7 obligatorios — el descanso no se lista)
  nota: string;    // 1-2 frases de consejo de la semana
};

export type WorkoutPlanRow = {
  id: string;
  source: "sample" | "ai";
  plan: WorkoutPlanContent;
  prefs: WorkoutPrefs;
  generated_at: string;
  /** Última generación IA exitosa — el rate-limit semanal se gatea contra ESTA columna. */
  ai_generated_at?: string | null;
};

/** Preferencias para la personalización con IA (Pro). */
export type WorkoutPrefs = {
  equipo?: string[];      // subset de EQUIPOS del catálogo
  lesiones?: string;      // texto libre corto
  preferencias?: string;  // texto libre corto
};

/** Una serie registrada (logging real del usuario). */
export type SerieLog = { reps: number; peso_kg: number | null };

export type ExerciseLogRow = {
  id: string;
  fecha: string; // YYYY-MM-DD
  exercise_slug: string;
  series: SerieLog[];
};

/** Resumen de progresión por ejercicio (calculado de los últimos logs). */
export type Progresion = {
  exercise_slug: string;
  ultima_fecha: string;
  ultima_series: SerieLog[];
  sugerencia_kg: number | null; // peso sugerido hoy (sobrecarga progresiva) — null si no aplica
};
