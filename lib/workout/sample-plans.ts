// F9 · Generador DETERMINISTA del plan de entrenamiento (el "plan base", free).
// Mismo contrato que el sample de F5: instantáneo, nunca falla, nunca llama IA.
// Misma entrada ⇒ mismo plan (los logs del seed demo dependen de esa estabilidad).

import { POR_SLUG, type Ejercicio, type Equipo } from "./catalog";
import {
  DIAS_SEMANA,
  type Bloque,
  type DiaPlan,
  type PerfilFisico,
  type WorkoutPlanContent,
  type WorkoutPrefs,
} from "./types";

/** Item de core.user_rutinas.actividades ya resuelto a slug de actividad. */
export type RutinaItem = { slug: string; frecuencia_semanal: number; duracion_min: number };

type Objetivo = PerfilFisico["objetivo"];

// ── Esquemas series×reps×descanso por objetivo ──
function esquema(objetivo: Objetivo, compuesto: boolean): Pick<Bloque, "series" | "reps" | "descanso_seg"> {
  if (objetivo === "ganar_musculo") {
    return compuesto
      ? { series: 4, reps: "6-10", descanso_seg: 120 }
      : { series: 3, reps: "8-12", descanso_seg: 90 };
  }
  if (objetivo === "perder_grasa") {
    return compuesto
      ? { series: 3, reps: "10-12", descanso_seg: 60 }
      : { series: 3, reps: "12-15", descanso_seg: 45 };
  }
  return compuesto
    ? { series: 3, reps: "8-10", descanso_seg: 90 }
    : { series: 3, reps: "10-12", descanso_seg: 60 };
}

// ── Splits de gym por nº de sesiones semanales ──
const SPLITS: Record<number, { titulo: string; slugs: string[] }[]> = {
  1: [
    { titulo: "full body", slugs: ["sentadilla", "press-banca", "remo-barra", "hip-thrust", "plancha"] },
  ],
  2: [
    { titulo: "full body a", slugs: ["sentadilla", "press-banca", "remo-barra", "curl-biceps", "plancha"] },
    { titulo: "full body b", slugs: ["hip-thrust", "press-militar", "jalon-al-pecho", "zancadas", "extension-triceps-polea", "elevacion-piernas"] },
  ],
  3: [
    { titulo: "empuje", slugs: ["press-banca", "press-militar", "press-inclinado", "elevaciones-laterales", "extension-triceps-polea", "plancha"] },
    { titulo: "tirón", slugs: ["peso-muerto", "remo-barra", "jalon-al-pecho", "face-pull", "curl-biceps"] },
    { titulo: "pierna + glúteo", slugs: ["sentadilla", "hip-thrust", "zancadas", "curl-femoral", "elevacion-pantorrilla", "elevacion-piernas"] },
  ],
  4: [
    { titulo: "torso a", slugs: ["press-banca", "remo-barra", "press-hombro-mancuernas", "jalon-al-pecho", "curl-biceps", "extension-triceps-polea"] },
    { titulo: "pierna a", slugs: ["sentadilla", "peso-muerto-rumano", "zancadas", "elevacion-pantorrilla", "plancha"] },
    { titulo: "torso b", slugs: ["press-inclinado", "remo-polea", "press-militar", "face-pull", "curl-martillo", "press-frances"] },
    { titulo: "pierna b", slugs: ["hip-thrust", "prensa", "sentadilla-bulgara", "curl-femoral", "elevacion-piernas"] },
  ],
  5: [
    { titulo: "empuje", slugs: ["press-banca", "press-militar", "press-inclinado", "elevaciones-laterales", "extension-triceps-polea"] },
    { titulo: "tirón", slugs: ["peso-muerto", "remo-barra", "jalon-al-pecho", "face-pull", "curl-biceps"] },
    { titulo: "pierna + glúteo", slugs: ["sentadilla", "hip-thrust", "zancadas", "curl-femoral", "elevacion-pantorrilla"] },
    { titulo: "torso", slugs: ["press-banca-mancuernas", "remo-mancuerna", "press-hombro-mancuernas", "curl-martillo", "press-frances"] },
    { titulo: "pierna + core", slugs: ["prensa", "sentadilla-bulgara", "peso-muerto-rumano", "plancha", "elevacion-piernas"] },
  ],
};

// ── Sustitución por equipo disponible (prefs Pro): mismo grupo muscular, equipo compatible.
// `usados` evita que dos slugs distintos colapsen al MISMO alternativo dentro de la sesión
// (review F9: con equipo ['mancuernas'], remo-barra y jalon-al-pecho caían ambos en
// remo-mancuerna). Si no queda alternativa libre, se conserva el original y la red final
// de dedupe en buildSampleWorkout descarta el duplicado.
function ajustaEquipo(slug: string, equipo: Equipo[] | undefined, usados: Set<string>): Ejercicio {
  const ej = POR_SLUG.get(slug)!;
  if (!equipo || equipo.length === 0) return ej;
  if (ej.equipo.some((e) => equipo.includes(e)) && !usados.has(ej.slug)) return ej;
  // Alternativa determinista: primer ejercicio LIBRE del mismo grupo que sí se pueda hacer.
  for (const alt of POR_SLUG.values()) {
    if (
      alt.actividad === "gym" &&
      alt.grupo === ej.grupo &&
      !usados.has(alt.slug) &&
      alt.equipo.some((e) => equipo.includes(e))
    ) {
      return alt;
    }
  }
  // Último recurso: versión de peso corporal libre del grupo, o el original.
  for (const alt of POR_SLUG.values()) {
    if (alt.actividad === "gym" && alt.grupo === ej.grupo && !usados.has(alt.slug) && alt.equipo.includes("peso_corporal")) {
      return alt;
    }
  }
  return ej;
}

function bloquesGym(slugs: string[], objetivo: Objetivo, equipo?: Equipo[]): Bloque[] {
  const usados = new Set<string>();
  const bloques = slugs.map((slug) => {
    const ej = ajustaEquipo(slug, equipo, usados);
    usados.add(ej.slug);
    return { exercise_slug: ej.slug, nombre: ej.nombre, ...esquema(objetivo, ej.compuesto) };
  });
  // Red final: jamás dos bloques del mismo ejercicio en una sesión.
  return bloques.filter(
    (b, i, arr) => arr.findIndex((x) => x.exercise_slug === b.exercise_slug) === i,
  );
}

// ── Sesiones de running por objetivo (rotación determinista) ──
const RUNNING_SESIONES: Record<string, { slug: string; reps: (min: number) => string; nota: string }[]> = {
  perder_grasa: [
    { slug: "intervalos-cortos", reps: () => "6×400m", nota: "fuerte en el intervalo, trote entre cada uno" },
    { slug: "rodaje-suave", reps: (m) => `${m} min`, nota: "ritmo conversacional" },
    { slug: "tempo", reps: (m) => `${Math.max(20, m - 10)} min`, nota: "ritmo cómodamente incómodo" },
    { slug: "rodaje-largo", reps: (m) => `${m + 15} min`, nota: "el más largo de la semana, sin prisa" },
  ],
  ganar_musculo: [
    { slug: "rodaje-suave", reps: (m) => `${m} min`, nota: "fácil — hoy el cardio no compite con la fuerza" },
    { slug: "trote-recuperacion", reps: (m) => `${Math.max(20, m - 15)} min`, nota: "muy suave, mueve las piernas" },
    { slug: "fartlek", reps: (m) => `${m} min`, nota: "juega con el ritmo cuando te sientas bien" },
  ],
  default: [
    { slug: "rodaje-suave", reps: (m) => `${m} min`, nota: "ritmo conversacional" },
    { slug: "intervalos-cortos", reps: () => "5×400m", nota: "fuerte en el intervalo, recupera caminando" },
    { slug: "rodaje-largo", reps: (m) => `${m + 10} min`, nota: "constante, termina con energía" },
    { slug: "tempo", reps: (m) => `${Math.max(20, m - 10)} min`, nota: "ritmo sostenido" },
  ],
};

function diaRunning(i: number, objetivo: Objetivo, duracionMin: number): { titulo: string; bloques: Bloque[] } {
  const pool = RUNNING_SESIONES[objetivo] ?? RUNNING_SESIONES.default;
  const s = pool[i % pool.length];
  const principal = POR_SLUG.get(s.slug)!;
  const calienta = POR_SLUG.get("trote-recuperacion")!;
  const bloques: Bloque[] = [
    { exercise_slug: calienta.slug, nombre: "Calentamiento — trote suave", series: 1, reps: "10 min", descanso_seg: 0 },
    { exercise_slug: principal.slug, nombre: principal.nombre, series: 1, reps: s.reps(duracionMin), descanso_seg: 0, nota: s.nota },
  ];
  return { titulo: principal.nombre.toLowerCase(), bloques };
}

// ── Pilates / ballet: bloques temáticos rotados ──
const PILATES_ROTACION = ["pilates-core-flow", "pilates-puente", "pilates-movilidad-cadera"];
const BALLET_ROTACION = ["ballet-plies", "ballet-releves", "ballet-centro"];

function diaControl(
  actividad: "pilates" | "ballet",
  i: number,
  duracionMin: number,
): { titulo: string; bloques: Bloque[] } {
  const [warm, rotacion, cool] =
    actividad === "pilates"
      ? (["pilates-cien", PILATES_ROTACION, "pilates-espalda"] as const)
      : (["ballet-barra", BALLET_ROTACION, "ballet-estiramiento"] as const);
  const principal = POR_SLUG.get(rotacion[i % rotacion.length])!;
  const tercio = Math.max(10, Math.round(duracionMin / 3 / 5) * 5);
  const mk = (slug: string, mins: number): Bloque => {
    const ej = POR_SLUG.get(slug)!;
    return { exercise_slug: ej.slug, nombre: ej.nombre, series: 1, reps: `${mins} min`, descanso_seg: 0 };
  };
  return {
    titulo: principal.nombre.toLowerCase(),
    bloques: [mk(warm, tercio), mk(principal.slug, tercio), mk(cool, tercio)],
  };
}

const NOTAS: Record<string, string> = {
  ganar_musculo:
    "Progresa el peso cada semana en los compuestos: si completas todas las series arriba del rango, sube 2.5 kg. La proteína diaria no se negocia.",
  perder_grasa:
    "Descansos cortos y técnica limpia — el déficit lo pone la cocina, el músculo lo defiende la fuerza. Camina más todos los días.",
  default:
    "Consistencia sobre intensidad: mejor las sesiones completas de la semana que una heroica. Ajusta pesos para terminar con 1-2 reps de reserva.",
};

/**
 * Construye el plan semanal determinista a partir de la rutina (disciplinas + frecuencia)
 * y el objetivo del perfil físico. Máximo 7 sesiones/semana (se recorta proporcional).
 */
export function buildSampleWorkout(
  fisico: PerfilFisico,
  rutina: RutinaItem[],
  prefs?: WorkoutPrefs,
): WorkoutPlanContent {
  const objetivo = fisico.objetivo;

  // Normaliza: solo disciplinas que el generador conoce, freq 1-7, orden estable.
  const items = rutina
    .filter((r) => ["gym", "running", "pilates", "ballet"].includes(r.slug))
    .map((r) => ({ ...r, frecuencia_semanal: Math.min(7, Math.max(1, r.frecuencia_semanal)) }))
    .sort((a, b) => b.frecuencia_semanal - a.frecuencia_semanal || a.slug.localeCompare(b.slug));

  // Cap global de 7 sesiones: recorta del más frecuente hacia abajo, dejando mínimo 1.
  let total = items.reduce((s, r) => s + r.frecuencia_semanal, 0);
  let guard = 0;
  while (total > 7 && guard++ < 30) {
    const mayor = items.reduce((a, b) => (b.frecuencia_semanal > a.frecuencia_semanal ? b : a));
    if (mayor.frecuencia_semanal <= 1) break;
    mayor.frecuencia_semanal -= 1;
    total -= 1;
  }

  // Sesiones intercaladas round-robin (gym, running, pilates, gym, running, ...) para
  // espaciar la misma disciplina; se asignan a lunes→domingo en ese orden.
  const colas = items.map((r) => ({ ...r, restantes: r.frecuencia_semanal, idx: 0 }));
  const sesiones: { slug: string; idx: number; duracion: number }[] = [];
  while (sesiones.length < total) {
    for (const c of colas) {
      if (c.restantes > 0) {
        sesiones.push({ slug: c.slug, idx: c.idx, duracion: c.duracion_min });
        c.idx += 1;
        c.restantes -= 1;
        if (sesiones.length >= total) break;
      }
    }
  }

  const gymCount = items.find((r) => r.slug === "gym")?.frecuencia_semanal ?? 0;
  const split = SPLITS[Math.min(5, Math.max(1, gymCount))] ?? SPLITS[1];

  const dias: DiaPlan[] = sesiones.map((s, i) => {
    const dia = DIAS_SEMANA[i % 7];
    if (s.slug === "gym") {
      const plantilla = split[s.idx % split.length];
      return {
        dia,
        actividad_slug: "gym",
        titulo: plantilla.titulo,
        bloques: bloquesGym(plantilla.slugs, objetivo, prefs?.equipo as Equipo[] | undefined),
      };
    }
    if (s.slug === "running") {
      const { titulo, bloques } = diaRunning(s.idx, objetivo, s.duracion);
      return { dia, actividad_slug: "running", titulo, bloques };
    }
    const { titulo, bloques } = diaControl(s.slug as "pilates" | "ballet", s.idx, s.duracion);
    return { dia, actividad_slug: s.slug, titulo, bloques };
  });

  return { dias, nota: NOTAS[objetivo] ?? NOTAS.default };
}
