import type { Exercise, ProfileId, DayKey } from "../types";

const e = (
  day: DayKey,
  order: number,
  name: string,
  description: string,
  sets: number,
  repsRange: string,
  weightMike?: string,
  weightAndy?: string,
  flags?: {
    isCircuit?: boolean;
    isSuperset?: boolean;
    starred?: boolean;
    starredFor?: ProfileId;
  }
): Exercise => ({
  id: `e-${day}-${order}`,
  day,
  order,
  name,
  description,
  sets,
  repsRange,
  weightMike,
  weightAndy,
  ...flags,
});

export const EXERCISES: Exercise[] = [
  // ===================== LUNES — Glúteo + Empuje (juntos) =====================
  e("lun", 1, "Sentadilla goblet con kettlebell",
    "Kettlebell al pecho, espalda recta, baja hasta paralelo. Descanso: 90 seg.",
    3, "10-12", "20 kg", "8-10 kg",
    { starred: true }),
  e("lun", 2, "Hip thrust en banco",
    "Espalda alta en banco, mancuerna sobre cadera. Aprieta glúteos 1 seg arriba.",
    4, "10-12", "24-30 kg", "10-14 kg",
    { starred: true, starredFor: "andy" }),
  e("lun", 3, "Press de pecho con mancuernas",
    "Banca plana, codos 45°. Bajar controlado 2 seg.",
    3, "10-12", "22 kg c/u", "5-6 kg c/u"),
  e("lun", 4, "Superset · Patada glúteo polea + Plancha",
    "A: 12 reps c/lado patada glúteo en polea baja → B: 30-45 seg plancha. Descanso 60 seg entre vueltas.",
    4, "—", "20-30 lb", "10-15 lb",
    { isSuperset: true }),

  // ===================== MARTES — Espalda + Bíceps (Mike solo) =====================
  e("mar", 1, "Jalón al pecho en polea",
    "Agarre abierto, inclinarse 15° atrás, jalar al pecho apretando dorsales.",
    4, "10", "110-130 lb", undefined,
    { starred: true }),
  e("mar", 2, "Remo con mancuerna a un brazo",
    "Apoyo en banco con rodilla. Jala codo atrás hacia cadera.",
    3, "10 c/lado", "20-24 kg"),
  e("mar", 3, "Remo sentado en máquina",
    "Pecho contra cojín, agarre neutro. Jala al abdomen apretando escápulas.",
    3, "12", "110-120 lb"),
  e("mar", 4, "Curl bíceps con mancuernas",
    "Sin balancear. Solo flexión de codo. Aprieta arriba.",
    4, "10-12", "10-14 kg c/u", undefined,
    { starred: true }),
  e("mar", 5, "Curl martillo",
    "Palmas mirándose. Trabaja braquial = grosor lateral.",
    3, "12", "10-12 kg c/u"),

  // ===================== MIÉRCOLES — Glúteo + Espalda + Core (juntos) =====================
  e("mie", 1, "Peso muerto rumano con mancuernas",
    "EL más importante para glúteos. Cadera atrás, mancuernas pegadas a piernas. Estira isquios.",
    3, "10-12", "14-18 kg c/u", "6-8 kg c/u",
    { starred: true, starredFor: "andy" }),
  e("mie", 2, "Circuito glúteo · 3 vueltas",
    "Hip thrust 12 → Sentadilla sumo 12 → Patada 4 puntos 15 c/lado. Descanso 90 seg entre vueltas.",
    3, "vueltas", "Hip 22kg · Sumo 18kg", "Hip 12kg · Sumo 8kg",
    { isCircuit: true }),
  e("mie", 3, "Jalón al pecho en polea",
    "Mismo movimiento. Para Andy: peso ligero, técnica primero.",
    3, "10", "110 lb", "30-40 lb"),
  e("mie", 4, "Abdominales bicicleta",
    "Codo opuesto a rodilla opuesta. Recto abdominal + oblicuos.",
    3, "20 c/lado", undefined, undefined,
    { starred: true, starredFor: "andy" }),

  // ===================== JUEVES — Pecho + Tríceps (Mike solo, pesado) =====================
  e("jue", 1, "Press banca con mancuernas pesado",
    "Día clave para tu pecho. Más peso que lunes. Últimas 2 reps cuestan.",
    4, "8-10", "24-26 kg c/u", undefined,
    { starred: true }),
  e("jue", 2, "Press inclinado con mancuernas",
    "Banca 30-45°. Pecho superior.",
    3, "10", "16-20 kg c/u"),
  e("jue", 3, "Aperturas en polea cruzada",
    "Poleas altas. Brazos casi rectos. Junta al frente apretando pecho.",
    3, "12", "15-25 lb"),
  e("jue", 4, "Fondos en máquina asistida",
    "Inclinado adelante para enfocar pecho.",
    3, "8-10"),
  e("jue", 5, "Extensión en polea con cuerda",
    "Codos pegados. Solo antebrazo. Separa cuerda al final.",
    3, "12", "30-40 lb"),

  // ===================== VIERNES — Glúteo + Hombros + Core (juntos) =====================
  e("vie", 1, "Hip thrust con barra o mancuerna",
    "Día pesado glúteo. Más peso que miércoles.",
    4, "10", "30-40 kg", "14-18 kg",
    { starred: true }),
  e("vie", 2, "Superset hombros · Press militar + Elevaciones laterales",
    "A: 10 press militar → B: 12 elevaciones laterales. Descanso 60 seg entre vueltas.",
    4, "—",
    "Press 14-18kg · Lat 5-8kg",
    "Press 4-6kg · Lat 2-3kg",
    { isSuperset: true }),
  e("vie", 3, "Sentadilla sumo con mancuerna",
    "Pies más abiertos. Glúteo medio.",
    3, "12", "22-26 kg", "10-14 kg"),
  e("vie", 4, "Finisher core · 3 vueltas",
    "Crunch 15 → Plancha lateral 20 seg c/lado → Mountain climbers 20. Descanso 60 seg entre vueltas.",
    3, "vueltas", undefined, undefined,
    { isCircuit: true }),

  // ===================== SÁBADO — Pierna opcional (Mike solo) =====================
  e("sab", 1, "Sentadilla Smith",
    "Más seguro yendo solo.",
    4, "8-10", "60-80 kg", undefined,
    { starred: true }),
  e("sab", 2, "Prensa 45°",
    "Pies altos = glúteo. Pies bajos = cuádriceps.",
    3, "12", "80-120 kg"),
  e("sab", 3, "Curl femoral tumbado",
    "Isquiotibiales. Sin levantar cadera.",
    3, "12", "30-50 lb"),
  e("sab", 4, "Elevación de talones",
    "Rango completo.",
    4, "15-20", "40-60 kg"),
];

export function getExercisesForDay(day: DayKey) {
  return EXERCISES.filter((e) => e.day === day).sort((a, b) => a.order - b.order);
}

// Andy hace ballet/pilates en mar/jue/sab → no gym exercises esos días
export function exercisesVisibleFor(user: ProfileId, day: DayKey) {
  const all = getExercisesForDay(day);
  if (day === "mar" || day === "jue" || day === "sab") {
    // Solo Mike entrena gym esos días. Andy ve actividad alternativa.
    return user === "mike" ? all : [];
  }
  return all;
}

export function alternativeActivityFor(user: ProfileId, day: DayKey): string | null {
  if (user === "andy") {
    if (day === "mar" || day === "jue" || day === "sab") return "Ballet 3 hrs";
  }
  if (day === "dom") return "Descanso activo";
  return null;
}
