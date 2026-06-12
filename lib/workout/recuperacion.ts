// Pre-entreno y recuperación (spec del founder, mock-first): datos puros,
// compartidos client/server. La IA (con key) personalizará; este es el piso.
import type { GrupoMuscular } from "./catalog";

export const ZONAS = [
  "rodilla",
  "hombro",
  "espalda_baja",
  "muneca",
  "tobillo",
  "cadera",
  "cuello",
] as const;
export type Zona = (typeof ZONAS)[number];

// Qué grupos musculares CARGAN cada zona — el plan del día marca "cuídate hoy"
// los ejercicios de esos grupos (conservador a propósito: mejor avisar de más).
export const ZONA_GRUPOS: Record<Zona, GrupoMuscular[]> = {
  rodilla: ["pierna", "gluteo", "cardio"],
  tobillo: ["pierna", "cardio"],
  cadera: ["gluteo", "pierna"],
  espalda_baja: ["espalda", "gluteo", "core"],
  hombro: ["hombro", "pecho"],
  muneca: ["brazo", "pecho", "hombro"],
  cuello: ["hombro", "espalda"],
};

export function zonaAfectaGrupo(zonas: Zona[], grupo: GrupoMuscular | undefined): boolean {
  if (!grupo) return false;
  return zonas.some((z) => ZONA_GRUPOS[z].includes(grupo));
}

// Tips de recuperación — SIEMPRE con alternativa para quien no le gusta
// (regla del founder: "meditación para los que no les gusta"). Rotación
// determinista por día: misma fecha ⇒ mismo tip (sin Math.random).
export type TipRecuperacion = { id: string; tip: string; alternativa: string };

export const TIPS_RECUPERACION: TipRecuperacion[] = [
  {
    id: "agua",
    tip: "hoy apunta a 2-3 litros de agua — el músculo que entrenas es 75% agua.",
    alternativa: "si el agua sola te aburre: agua mineral con limón cuenta igual.",
  },
  {
    id: "sueno",
    tip: "el músculo crece dormido: hoy intenta acostarte 30 min antes.",
    alternativa: "si no puedes dormir más, una siesta de 20 min también repara.",
  },
  {
    id: "meditacion",
    tip: "5 minutos de meditación bajan el cortisol post-entreno.",
    alternativa: "¿no es lo tuyo? respiración 4-7-8: inhala 4s, sostén 7s, exhala 8s, ×4.",
  },
  {
    id: "caminata",
    tip: "10 minutos de caminata suave después de entrenar aceleran la recuperación.",
    alternativa: "si no hay tiempo: 2 min de movilidad de cadera y hombros en casa.",
  },
  {
    id: "estiramiento",
    tip: "estira 5 min lo que entrenaste hoy — mañana se nota.",
    alternativa: "¿flojera de rutina? solo cuádriceps y pecho, 30s por lado.",
  },
  {
    id: "pantallas",
    tip: "pantallas fuera 30 min antes de dormir = sueño más profundo = más recuperación.",
    alternativa: "si no sueltas el teléfono: al menos modo noche y brillo al mínimo.",
  },
];

// fechaISO = YYYY-MM-DD (CDMX) → tip determinista del día.
export function tipDelDia(fechaISO: string): TipRecuperacion {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const seed = y * 372 + m * 31 + d;
  return TIPS_RECUPERACION[seed % TIPS_RECUPERACION.length];
}
