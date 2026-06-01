// Balance de leveling (F3a). Todo derivado puro de los stats crudos del character.
// Tunear AQUÍ, no en la lógica. Ver spec v2 §3.5.
import type { StatKey } from "@/lib/scoring/types";

// ── Display: comprime el acumulador crudo (un check-in suma ~45) a la escala
//    0..150+ de tiers del spec. raw≈10 → 0 (los primeros puntos son Novato). ──
export const DISPLAY_FLOOR_LOG = 1.0; // resta log10≈1 → el origen de la escala
export const DISPLAY_K = 26; // pendiente sobre log10(raw)

// Tiers de display. Nombres universales (app internacional). El último que cumple `min` gana.
export const TIERS = [
  { name: "Rookie", min: 0 },
  { name: "Apprentice", min: 25 },
  { name: "Athlete", min: 50 },
  { name: "Expert", min: 75 },
  { name: "Master", min: 100 },
  { name: "Legend", min: 150 },
] as const;

// ── Nivel: XP = suma de los 6 stats crudos; curva cuadrática (cada nivel cuesta
//    más). nivel n arranca en (n-1)² · BASE de XP. nivel 50 ≈ 120k XP. ──
export const XP_PER_LEVEL_BASE = 50;

// ── Clases (determinístico, nombres universales; editable libremente) ──
export const CLASS_PURE: Record<StatKey, string> = {
  fue: "The Titan",      // strength
  res: "The Marathoner", // endurance
  flex: "The Acrobat",   // flexibility
  vel: "The Sprinter",   // speed
  equ: "The Anchor",     // balance
  vit: "The Phoenix",    // vitality
};
export const CLASS_NOVATO = "Rookie"; // sin progreso real aún
export const CLASS_BALANCED = "The Athlete"; // perfil parejo, nivel medio
export const CLASS_ALLROUND = "The Pentathlete"; // parejo y alto (todas ≥ Athlete)
export const CLASS_MAXED = "The Apex"; // todas Master+

// Dúos con nombre propio: si las 2 stats top son este par → este nombre.
export const CLASS_DUO: { pair: [StatKey, StatKey]; name: string }[] = [
  { pair: ["flex", "equ"], name: "The Dancer" },
];

export const NOVATO_CEIL = 25; // si el stat más alto < esto → todavía Novato
export const BALANCE_RATIO = 0.6; // min/max de displays ≥ esto → perfil "parejo"
