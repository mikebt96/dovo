// F9 · Catálogo curado de ejercicios (es-MX). Fuente de verdad EN CÓDIGO (precedente F5:
// los platillos tampoco tienen tabla). El slug es la identidad estable que usan el plan
// jsonb y exercise_logs; cambiar el catálogo = PR, no migración.

export type Equipo =
  | "barra"
  | "mancuernas"
  | "polea"
  | "maquina"
  | "peso_corporal"
  | "banda"
  | "kettlebell";

export type GrupoMuscular =
  | "gluteo"
  | "pierna"
  | "pecho"
  | "espalda"
  | "hombro"
  | "brazo"
  | "core"
  | "full"
  | "cardio"
  | "movilidad";

export type Ejercicio = {
  slug: string;
  nombre: string;
  actividad: "gym" | "running" | "pilates" | "ballet";
  grupo: GrupoMuscular;
  equipo: Equipo[];
  /** true = multiarticular (va primero en la sesión, esquema de fuerza) */
  compuesto: boolean;
  /** true = se registra peso (aparece sugerencia de progresión en kg) */
  con_peso: boolean;
};

const E = (
  slug: string,
  nombre: string,
  actividad: Ejercicio["actividad"],
  grupo: GrupoMuscular,
  equipo: Equipo[],
  compuesto = false,
  con_peso = true,
): Ejercicio => ({ slug, nombre, actividad, grupo, equipo, compuesto, con_peso });

export const CATALOGO: Ejercicio[] = [
  // ── GYM · glúteo / cadera ──
  E("hip-thrust", "Hip thrust", "gym", "gluteo", ["barra"], true),
  E("puente-gluteo", "Puente de glúteo", "gym", "gluteo", ["peso_corporal"], false, false),
  E("peso-muerto", "Peso muerto", "gym", "gluteo", ["barra"], true),
  E("peso-muerto-rumano", "Peso muerto rumano", "gym", "gluteo", ["barra", "mancuernas"], true),
  E("patada-gluteo-polea", "Patada de glúteo en polea", "gym", "gluteo", ["polea"]),
  E("abduccion-maquina", "Abducción en máquina", "gym", "gluteo", ["maquina"]),
  // ── GYM · pierna (rodilla) ──
  E("sentadilla", "Sentadilla con barra", "gym", "pierna", ["barra"], true),
  E("sentadilla-goblet", "Sentadilla goblet", "gym", "pierna", ["mancuernas", "kettlebell"], true),
  E("prensa", "Prensa de pierna", "gym", "pierna", ["maquina"], true),
  E("zancadas", "Zancadas con mancuernas", "gym", "pierna", ["mancuernas"], true),
  E("sentadilla-bulgara", "Sentadilla búlgara", "gym", "pierna", ["mancuernas"], true),
  E("extension-pierna", "Extensión de pierna", "gym", "pierna", ["maquina"]),
  E("curl-femoral", "Curl femoral", "gym", "pierna", ["maquina"]),
  E("elevacion-pantorrilla", "Elevación de pantorrilla", "gym", "pierna", ["maquina", "peso_corporal"]),
  // ── GYM · pecho (empuje horizontal) ──
  E("press-banca", "Press de banca", "gym", "pecho", ["barra"], true),
  E("press-banca-mancuernas", "Press de banca con mancuernas", "gym", "pecho", ["mancuernas"], true),
  E("press-inclinado", "Press inclinado", "gym", "pecho", ["barra", "mancuernas"], true),
  E("lagartijas", "Lagartijas", "gym", "pecho", ["peso_corporal"], true, false),
  E("aperturas", "Aperturas con mancuernas", "gym", "pecho", ["mancuernas"]),
  E("cruce-polea", "Cruce en polea", "gym", "pecho", ["polea"]),
  // ── GYM · hombro (empuje vertical) ──
  E("press-militar", "Press militar", "gym", "hombro", ["barra"], true),
  E("press-hombro-mancuernas", "Press de hombro con mancuernas", "gym", "hombro", ["mancuernas"], true),
  E("elevaciones-laterales", "Elevaciones laterales", "gym", "hombro", ["mancuernas"]),
  E("face-pull", "Face pull", "gym", "hombro", ["polea", "banda"]),
  // ── GYM · espalda (tirón) ──
  E("remo-barra", "Remo con barra", "gym", "espalda", ["barra"], true),
  E("remo-mancuerna", "Remo con mancuerna", "gym", "espalda", ["mancuernas"], true),
  E("remo-polea", "Remo en polea baja", "gym", "espalda", ["polea"], true),
  E("dominadas", "Dominadas", "gym", "espalda", ["peso_corporal"], true, false),
  E("jalon-al-pecho", "Jalón al pecho", "gym", "espalda", ["polea"], true),
  // ── GYM · brazo ──
  E("curl-biceps", "Curl de bíceps", "gym", "brazo", ["barra", "mancuernas"]),
  E("curl-martillo", "Curl martillo", "gym", "brazo", ["mancuernas"]),
  E("extension-triceps-polea", "Extensión de tríceps en polea", "gym", "brazo", ["polea"]),
  E("press-frances", "Press francés", "gym", "brazo", ["barra", "mancuernas"]),
  E("fondos", "Fondos en paralelas", "gym", "brazo", ["peso_corporal"], true, false),
  // ── GYM · core ──
  E("plancha", "Plancha", "gym", "core", ["peso_corporal"], false, false),
  E("plancha-lateral", "Plancha lateral", "gym", "core", ["peso_corporal"], false, false),
  E("crunch-polea", "Crunch en polea", "gym", "core", ["polea"]),
  E("elevacion-piernas", "Elevación de piernas", "gym", "core", ["peso_corporal"], false, false),
  E("pallof-press", "Pallof press", "gym", "core", ["polea", "banda"]),
  // ── GYM · full / acondicionamiento ──
  E("kettlebell-swing", "Kettlebell swing", "gym", "full", ["kettlebell"], true),
  E("farmer-walk", "Farmer walk", "gym", "full", ["mancuernas", "kettlebell"], true),
  E("burpees", "Burpees", "gym", "full", ["peso_corporal"], true, false),
  E("remo-maquina", "Remo en máquina (cardio)", "gym", "cardio", ["maquina"], true, false),
  // ── RUNNING · sesiones tipo ──
  E("rodaje-suave", "Rodaje suave", "running", "cardio", ["peso_corporal"], true, false),
  E("rodaje-largo", "Rodaje largo", "running", "cardio", ["peso_corporal"], true, false),
  E("intervalos-cortos", "Intervalos cortos", "running", "cardio", ["peso_corporal"], true, false),
  E("intervalos-largos", "Intervalos largos", "running", "cardio", ["peso_corporal"], true, false),
  E("tempo", "Carrera tempo", "running", "cardio", ["peso_corporal"], true, false),
  E("cuestas", "Repeticiones en cuesta", "running", "cardio", ["peso_corporal"], true, false),
  E("fartlek", "Fartlek", "running", "cardio", ["peso_corporal"], true, false),
  E("trote-recuperacion", "Trote de recuperación", "running", "cardio", ["peso_corporal"], false, false),
  // ── PILATES · bloques ──
  E("pilates-cien", "El cien", "pilates", "core", ["peso_corporal"], false, false),
  E("pilates-core-flow", "Core flow", "pilates", "core", ["peso_corporal"], false, false),
  E("pilates-puente", "Puente con articulación", "pilates", "gluteo", ["peso_corporal"], false, false),
  E("pilates-plancha-flow", "Plancha flow", "pilates", "core", ["peso_corporal"], false, false),
  E("pilates-movilidad-cadera", "Movilidad de cadera", "pilates", "movilidad", ["peso_corporal"], false, false),
  E("pilates-espalda", "Extensiones de espalda", "pilates", "movilidad", ["peso_corporal"], false, false),
  // ── BALLET · bloques ──
  E("ballet-barra", "Trabajo de barra", "ballet", "pierna", ["peso_corporal"], false, false),
  E("ballet-plies", "Pliés", "ballet", "pierna", ["peso_corporal"], false, false),
  E("ballet-releves", "Relevés", "ballet", "pierna", ["peso_corporal"], false, false),
  E("ballet-centro", "Trabajo de centro", "ballet", "full", ["peso_corporal"], false, false),
  E("ballet-estiramiento", "Estiramiento y puntas", "ballet", "movilidad", ["peso_corporal"], false, false),
];

export const POR_SLUG: ReadonlyMap<string, Ejercicio> = new Map(
  CATALOGO.map((e) => [e.slug, e]),
);

export const SLUGS: readonly string[] = CATALOGO.map((e) => e.slug);

export const EQUIPOS: readonly Equipo[] = [
  "barra",
  "mancuernas",
  "polea",
  "maquina",
  "peso_corporal",
  "banda",
  "kettlebell",
];
