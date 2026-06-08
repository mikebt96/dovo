// Balance de juego de dovofit. Tunear AQUÍ, no en la lógica. Ver spec F2 §5/D4.
// El seed core.actividades.kcal_por_min asume una persona de ~70 kg.
export const PESO_REFERENCIA_KG = 70;

// Distribución de puntos a stats del personaje.
export const STAT_PRIMARY_FACTOR = 1.0; // cada stat primaria de la actividad
export const STAT_SECONDARY_FACTOR = 0.4; // cada stat secundaria

// Factor de intensidad (solo actividades con métrica `intensidad` 1-5: ballet, pilates).
export const INTENSIDAD_BASE = 0.6; // intensidad=1 → 0.6
export const INTENSIDAD_STEP = 0.2; // +0.2 por nivel → intensidad=5 → 1.4
export const FACTOR_DEFAULT = 1.0; // gym, running, o sin intensidad

// ── Caps anti-trampa (Fase B/C). El leaderboard/retos suman puntos crudos, así
//    que estos topes protegen la integridad competitiva. Última línea de defensa. ──
export const CAP_PUNTOS_SESION = 1000; // por check-in — enforced en apply_checkin (DB)
export const CAP_PUNTOS_DIA = 1800; // por miembro/día — enforced en action crearCheckin (TS)
export const CAP_DURACION_MIN = 180; // por check-in — enforced en calcularKcal (TS)
export const CAP_CHECKINS_ACTIVIDAD_DIA = 3; // por actividad/día — enforced en apply_checkin (DB)

// ── Boosts intra-dúo + retos dúo-vs-dúo (Fase C). ──
export const BOOST_FACTOR = 1.5; // boost "energía": +50% al siguiente check-in del receptor
export const BOOST_GATING_RACHAS = 2; // racha de dúo mínima para desbloquear regalar boosts
export const RETO_DURACION_DIAS = 7; // duelo de 1 ciclo de compliance
export const RETO_ACEPTAR_HORAS = 48; // ventana para aceptar antes de expirar
