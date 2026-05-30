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
