import type { PerfilFisico } from "./types";

// Macros objetivo por FÓRMULA (deterministas, sin IA): TDEE = BMR × factor de actividad,
// ajustado por objetivo. Proteína por kg de peso, grasa por kg, el resto en carbohidratos.
// Mismas cifras que ve el sample y que recibe el prompt de Claude (consistencia).

const FACTOR_ACTIVIDAD: Record<PerfilFisico["nivel_actividad"], number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

// Ajuste calórico por objetivo: déficit moderado −20%, superávit conservador +12%,
// resistencia ligeramente arriba de mantenimiento (+5%, demanda glucolítica).
const AJUSTE_OBJETIVO: Record<PerfilFisico["objetivo"], number> = {
  perder_grasa: 0.8,
  mantener: 1.0,
  ganar_musculo: 1.12,
  mejorar_resistencia: 1.05,
};

// Fallback Mifflin-St Jeor si el perfil no trae bmr_calculado.
function bmrFallback(p: PerfilFisico): number {
  const base = 10 * p.peso_kg + 6.25 * p.altura_cm - 5 * p.edad;
  return p.genero === "masculino" ? base + 5 : base - 161;
}

export type MacrosObjetivo = {
  kcal: number;
  prot: number; // g/día
  carb: number;
  grasa: number;
};

export function macrosObjetivo(p: PerfilFisico): MacrosObjetivo {
  const bmr = p.bmr_calculado && p.bmr_calculado > 0 ? p.bmr_calculado : bmrFallback(p);
  const tdee = bmr * FACTOR_ACTIVIDAD[p.nivel_actividad];
  const kcal = Math.round((tdee * AJUSTE_OBJETIVO[p.objetivo]) / 10) * 10;

  // Proteína: 2.0 g/kg en superávit (síntesis), 1.8 g/kg en el resto. Grasa: 0.9 g/kg.
  const protPorKg = p.objetivo === "ganar_musculo" ? 2.0 : 1.8;
  const prot = Math.round(protPorKg * p.peso_kg);
  const grasa = Math.round(0.9 * p.peso_kg);
  const carb = Math.max(0, Math.round((kcal - prot * 4 - grasa * 9) / 4));

  return { kcal, prot, carb, grasa };
}
