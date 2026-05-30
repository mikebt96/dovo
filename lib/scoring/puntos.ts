// Normaliza kcal por el metabolismo basal del user (kcal por minuto-basal).
export function calcularPuntos(kcal: number, bmr: number): number {
  if (!(bmr > 0)) return 0;
  const basalPorMinuto = bmr / 1440;
  return Math.round(kcal / basalPorMinuto);
}
