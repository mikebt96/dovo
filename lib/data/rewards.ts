import type { RewardSeed, PenaltySeed } from "../types";

/**
 * Premios sugeridos. Editables en /tienda (cualquiera de los dos puede agregar/editar).
 * Filosofía: empieza con costos accesibles (50 coins) para ganar momentum rápido,
 * y deja premios grandes (1000+) como horizonte largo (cada coin = 5 XP ≈ 1 día completo bien hecho).
 */
export const REWARDS_SEED: RewardSeed[] = [
  // === FÁCILES (50-100 coins · ~1 semana de disciplina) ===
  {
    name: "Café de especialidad juntos",
    description: "El café cool que dejaste de pedir en tu zona favorita.",
    category: "cine",
    costCoins: 50,
    requiresBoth: true,
  },
  {
    name: "Postre del cheat night",
    description: "Lo que se les antoje sin culpa.",
    category: "cine",
    costCoins: 60,
    requiresBoth: false,
  },
  {
    name: "Película o serie maratón",
    description: "Reservar la noche con la peli/serie del otro.",
    category: "cine",
    costCoins: 80,
    requiresBoth: true,
  },

  // === MEDIANOS (100-250 coins · ~2-3 semanas) ===
  {
    name: "Suplemento nuevo",
    description: "Creatina, BCAAs, preworkout, lo que falte.",
    category: "suplementos",
    costCoins: 120,
    requiresBoth: false,
  },
  {
    name: "Top o sports bra nuevo",
    description: "Ropa deportiva — uno cada quien.",
    category: "gym_gear",
    costCoins: 150,
    requiresBoth: false,
  },
  {
    name: "Masaje pareja 30 min",
    description: "Uno al otro, sin distracciones.",
    category: "experiencia",
    costCoins: 180,
    requiresBoth: true,
  },
  {
    name: "Cena en restaurante favorito",
    description: "Ese que solo van en ocasiones especiales.",
    category: "experiencia",
    costCoins: 250,
    requiresBoth: true,
  },

  // === GRANDES (300-500 coins · ~1 mes) ===
  {
    name: "Banda de resistencia + accesorio gym",
    description: "Kettlebell, bandas, foam roller — lo que les falte.",
    category: "gym_gear",
    costCoins: 300,
    requiresBoth: false,
  },
  {
    name: "Outfit completo deportivo",
    description: "Top, leggings/short, calcetas — set completo.",
    category: "ropa",
    costCoins: 400,
    requiresBoth: false,
  },
  {
    name: "Sesión de masaje pro 60 min",
    description: "Spa real, no casero.",
    category: "experiencia",
    costCoins: 450,
    requiresBoth: false,
  },

  // === GRANDOTES (600-1000 coins · ~6-8 semanas) ===
  {
    name: "Tenis nuevos para gym",
    description: "Los Nike Metcon, los HOKA, los que estás viendo hace meses.",
    category: "gym_gear",
    costCoins: 700,
    requiresBoth: false,
  },
  {
    name: "Concierto, evento o experiencia única",
    description: "Boletos a algo que querían ir.",
    category: "experiencia",
    costCoins: 850,
    requiresBoth: true,
  },

  // === ÉPICOS (1000+ coins · 12+ semanas, milestone serio) ===
  {
    name: "Escapada de fin de semana",
    description: "Tulum, Valle de Bravo, San Miguel — donde sea.",
    category: "experiencia",
    costCoins: 1500,
    requiresBoth: true,
  },
  {
    name: "Tatuaje pareja o cambio físico que quieran celebrar",
    description: "Solo cuando ambos pasen 90 días de streak. El premio de premios.",
    category: "custom",
    costCoins: 3000,
    requiresBoth: true,
  },
];

/**
 * Castigos sugeridos. Editables en /castigos.
 * Filosofía: consensuales, finitos, NO humillantes. Si rompes streak, le debes algo al otro.
 * Severity 1 = light (rompiste 1 día). Severity 2 = medium (3+ días). Severity 3 = heavy (semana entera).
 */
export const PENALTIES_SEED: PenaltySeed[] = [
  // === LIGEROS (severity 1) — Por romper 1 día ===
  {
    name: "Lavar trastes 1 día",
    description: "El día siguiente a romper streak.",
    category: "domestico",
    severity: 1,
  },
  {
    name: "Café en la cama",
    description: "Preparar y llevar el café del otro al despertar.",
    category: "convivencia",
    severity: 1,
  },
  {
    name: "Poner la peli que él/ella quiera",
    description: "Sin protestar. Sin trampas (sí, hasta El Diario de Bridget Jones).",
    category: "convivencia",
    severity: 1,
  },
  {
    name: "Masaje 15 min",
    description: "Al otro. No al revés.",
    category: "convivencia",
    severity: 1,
  },

  // === MEDIANOS (severity 2) — Por romper 3+ días en una semana ===
  {
    name: "Lavar trastes toda la semana",
    description: "7 días seguidos. No hay debate.",
    category: "domestico",
    severity: 2,
  },
  {
    name: "Sacar la basura toda la semana",
    description: "Sin recordatorios. Si se olvida, +1 día.",
    category: "domestico",
    severity: 2,
  },
  {
    name: "Pagar el café del fin de semana",
    description: "Tres cafés del weekend van por tu cuenta.",
    category: "economico",
    severity: 2,
  },
  {
    name: "Gym extra sin compañía",
    description: "Una sesión solo, sin el apoyo del otro. Disciplina pura.",
    category: "disciplina",
    severity: 2,
  },
  {
    name: "Cocinar la cena 3 días",
    description: "Tres cenas seguidas. Tú eliges qué, pero respetando macros del otro.",
    category: "domestico",
    severity: 2,
  },

  // === PESADOS (severity 3) — Por romper streak entero (semana completa) ===
  {
    name: "Lavar ropa de la pareja 2 semanas",
    description: "Toda. Doblada. Guardada.",
    category: "domestico",
    severity: 3,
  },
  {
    name: "Cena en restaurante favorito · pagas tú",
    description: "El restaurante que el OTRO quiere.",
    category: "economico",
    severity: 3,
  },
  {
    name: "Hacer la rutina del otro completa",
    description: "Si Andy rompió streak, hace la rutina pesada de Mike. Si Mike rompió, hace ballet con Andy. Humilde.",
    category: "disciplina",
    severity: 3,
  },
  {
    name: "Día completo de servicio",
    description: "Sábado o domingo entero al servicio del otro. Desayuno en cama, planes a su gusto, sin queja.",
    category: "convivencia",
    severity: 3,
  },
];
