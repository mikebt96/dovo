// F9 · Fechas en la zona del usuario (México). Lección del review 2026-06-09: Vercel
// corre en UTC y `new Date().getDay()` marca "hoy" como mañana desde las ~18:00 CDMX.

const TZ = "America/Mexico_City";

/** YYYY-MM-DD de hoy en CDMX (en-CA formatea exactamente ISO). */
export function hoyCDMX(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Nombre del día de hoy en CDMX, en minúsculas y con acentos ("miércoles"). */
export function diaSemanaCDMX(): string {
  return new Intl.DateTimeFormat("es-MX", { timeZone: TZ, weekday: "long" })
    .format(new Date())
    .toLowerCase();
}

/** Lunes ISO (YYYY-MM-DD) de la semana CDMX; offset en semanas (-1 = la que
 *  acaba de cerrar). Mismo cálculo que date_trunc('week', …) de los crons. */
export function lunesSemanaCDMX(offsetWeeks = 0): string {
  const d = new Date(hoyCDMX() + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunes
  d.setUTCDate(d.getUTCDate() - dow + offsetWeeks * 7);
  return d.toISOString().slice(0, 10);
}
