// Catálogo de LA APUESTA (el trasfondo de la app): la app PROPONE el premio
// según la racha del trato — a más constancia, premios más grandes porque YA
// se los ganaron. Jamás impone: el texto final siempre es del dúo (campo
// libre). Voz MX, cualquier dúo (parejas, amigos, rivales — BRAND.md).
// Mock-first: con key, la IA propondrá premios personalizados al historial.

export type TierPremio = {
  id: string;
  minRacha: number; // racha del trato desde la que se proponen
  nombre: string; // etiqueta del tier (voz de juego)
  premios: string[];
};

export const TIERS_PREMIO: TierPremio[] = [
  {
    id: "calentando",
    minRacha: 0,
    nombre: "calentando",
    premios: [
      "un helado el domingo",
      "el café de mañana",
      "elegir la peli del viernes",
      "postre después de la cena",
      "una hora sin pendientes, juntos",
    ],
  },
  {
    id: "agarrando-ritmo",
    minRacha: 3,
    nombre: "agarrando ritmo",
    premios: [
      "ir al cine",
      "cena de tacos sin culpa",
      "desayuno fuera el sábado",
      "boliche o billar",
      "maratón de su serie con botana",
    ],
  },
  {
    id: "en-serio",
    minRacha: 8,
    nombre: "esto va en serio",
    premios: [
      "cena en su restaurante favorito",
      "día de alberca o spa",
      "esa sudadera / tenis que traen vistos",
      "escapada de un día fuera de la ciudad",
      "boletos para algo en vivo",
    ],
  },
  {
    id: "veteranos",
    minRacha: 16,
    nombre: "veteranos",
    premios: [
      "concierto o partido juntos",
      "fin de semana fuera",
      "el gadget que llevan meses viendo",
      "sesión de fotos del progreso",
    ],
  },
  {
    id: "leyendas",
    minRacha: 30,
    nombre: "leyendas",
    premios: [
      "el viaje que llevan posponiendo",
      "lo grande — ya se lo ganaron",
      "renovar el guardarropa del gym completo",
    ],
  },
];

// La apuesta interna (lo que paga quien quede abajo): chiquita, pareja y con
// humor — pica pero no duele. La misma escala para todos los niveles.
export const APUESTAS_INTERNAS: string[] = [
  "las palomitas",
  "los tacos",
  "el café de toda la semana",
  "lavar los trastes 3 días",
  "el uber del plan",
  "masaje de 15 minutos",
  "el otro elige el plan del finde",
  "la playlist del gym la elige el otro",
];

// Tier vigente + el siguiente (para enseñar qué desbloquean si siguen).
export function tierPorRacha(racha: number): {
  actual: TierPremio;
  siguiente: TierPremio | null;
} {
  let actual = TIERS_PREMIO[0];
  for (const t of TIERS_PREMIO) if (racha >= t.minRacha) actual = t;
  const idx = TIERS_PREMIO.indexOf(actual);
  return { actual, siguiente: TIERS_PREMIO[idx + 1] ?? null };
}

// Sugerencias del día (deterministas — sin Math.random): rota el catálogo del
// tier por fecha para que no siempre proponga lo mismo.
export function sugerenciasPremio(racha: number, fechaISO: string, n = 3): string[] {
  const { actual } = tierPorRacha(racha);
  const [y, m, d] = fechaISO.split("-").map(Number);
  const seed = y * 372 + m * 31 + d;
  const out: string[] = [];
  for (let i = 0; i < Math.min(n, actual.premios.length); i++) {
    out.push(actual.premios[(seed + i) % actual.premios.length]);
  }
  return out;
}

export function sugerenciasApuesta(fechaISO: string, n = 3): string[] {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const seed = y * 372 + m * 31 + d + 7;
  const out: string[] = [];
  for (let i = 0; i < Math.min(n, APUESTAS_INTERNAS.length); i++) {
    out.push(APUESTAS_INTERNAS[(seed + i) % APUESTAS_INTERNAS.length]);
  }
  return out;
}
