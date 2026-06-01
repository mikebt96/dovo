// Leveling F3a — derivación pura del character sheet desde los 6 stats crudos.
// Sin estado, sin BD: los stats son la fuente de verdad; nivel/clase/tier se calculan.
import type { StatKey } from "@/lib/scoring/types";
import { STAT_KEYS } from "@/lib/scoring/types";
import * as C from "./constants";

export type Tier = { name: string; index: number };
export type Stats = Record<StatKey, number>;

export type CharacterSheet = {
  nivel: number;
  xp: number; // total acumulado (suma de stats, redondeada)
  xpEnNivel: number; // XP dentro del nivel actual
  xpParaSiguiente: number; // XP que falta para el siguiente nivel
  progresoNivel: number; // 0..1 dentro del nivel actual (para barras de progreso)
  className: string;
  tiers: Record<StatKey, Tier>;
};

// Acumulador crudo → valor display 0..150+ (log comprimido, clamp inferior a 0).
export function statDisplay(raw: number): number {
  if (!(raw > 0)) return 0;
  const d = (Math.log10(raw + 1) - C.DISPLAY_FLOOR_LOG) * C.DISPLAY_K;
  return Math.max(0, Math.floor(d));
}

// Valor display → tier (el último umbral que se cumple).
export function tierFor(displayVal: number): Tier {
  let idx = 0;
  for (let i = 0; i < C.TIERS.length; i++) {
    if (displayVal >= C.TIERS[i].min) idx = i;
  }
  return { name: C.TIERS[idx].name, index: idx };
}

// XP total → nivel. Curva cuadrática inversa: nivel n empieza en (n-1)²·BASE.
export function nivelDesdeXp(xp: number): number {
  if (!(xp > 0)) return 1;
  return Math.floor(Math.sqrt(xp / C.XP_PER_LEVEL_BASE)) + 1;
}

// XP acumulado en el que arranca un nivel dado.
export function xpDeNivel(n: number): number {
  const k = Math.max(0, n - 1);
  return k * k * C.XP_PER_LEVEL_BASE;
}

// Nombre de clase determinístico según la forma del perfil de stats.
export function className(stats: Stats, prestige = 0): string {
  const displays = STAT_KEYS.map((k) => ({ k, d: statDisplay(stats[k]) }));
  const sorted = [...displays].sort((a, b) => b.d - a.d);
  const maxD = sorted[0].d;
  const minD = sorted[sorted.length - 1].d;

  let base: string;
  if (maxD < C.NOVATO_CEIL) {
    base = C.CLASS_NOVATO;
  } else if (displays.every((s) => s.d >= 100)) {
    base = C.CLASS_MAXED;
  } else if (maxD > 0 && minD / maxD >= C.BALANCE_RATIO) {
    // perfil parejo: alto → Pentatleta, medio → Atleta
    base = displays.every((s) => s.d >= 50) ? C.CLASS_ALLROUND : C.CLASS_BALANCED;
  } else {
    // dominado por la(s) stat(s) top: ¿dúo con nombre propio, o puro?
    const top1 = sorted[0];
    const top2 = sorted[1];
    const duo = C.CLASS_DUO.find(
      ({ pair }) =>
        pair.includes(top1.k) &&
        pair.includes(top2.k) &&
        top1.d > 0 &&
        top2.d / top1.d >= C.BALANCE_RATIO,
    );
    base = duo ? duo.name : C.CLASS_PURE[top1.k];
  }
  return prestige > 0 ? `${base} · Immortal ${prestige}` : base;
}

// Orquestador: stats → character sheet completo.
export function characterSheet(stats: Stats, prestige = 0): CharacterSheet {
  const xp = Math.round(STAT_KEYS.reduce((s, k) => s + (stats[k] || 0), 0));
  const nivel = nivelDesdeXp(xp);
  const xpBase = xpDeNivel(nivel);
  const xpNext = xpDeNivel(nivel + 1);
  const span = xpNext - xpBase;
  const tiers = {} as Record<StatKey, Tier>;
  for (const k of STAT_KEYS) tiers[k] = tierFor(statDisplay(stats[k]));
  return {
    nivel,
    xp,
    xpEnNivel: xp - xpBase,
    xpParaSiguiente: Math.max(0, xpNext - xp),
    progresoNivel: span > 0 ? Math.min(1, (xp - xpBase) / span) : 0,
    className: className(stats, prestige),
    tiers,
  };
}
