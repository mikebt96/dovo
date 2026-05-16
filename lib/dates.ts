import type { DayKey } from "./types";

const DAY_KEYS: DayKey[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

export function todayKey(): DayKey {
  return DAY_KEYS[new Date().getDay()];
}

export function dayLabel(key: DayKey): string {
  return ({
    lun: "Lunes",
    mar: "Martes",
    mie: "Miércoles",
    jue: "Jueves",
    vie: "Viernes",
    sab: "Sábado",
    dom: "Domingo",
  } as const)[key];
}

export function isValidDayKey(x: string): x is DayKey {
  return ["lun", "mar", "mie", "jue", "vie", "sab", "dom"].includes(x);
}

export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function isoWeek(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function pad(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}

const MONTH_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function dateLong(d: Date = new Date()): string {
  return `${d.getDate()} ${MONTH_LONG[d.getMonth()]}`;
}

/** ISO YYYY-MM-DD para hoy en tiempo local. */
export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Devuelve YYYY-MM-DD del lunes de la semana de `d`.
 * Semana ISO (lunes = inicio). Se usa como `week_start` en shopping_check
 * y prep_check para que las marcas se resetean en la nueva semana.
 */
export function mondayOf(d: Date = new Date()): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = date.getDay(); // 0=dom .. 6=sab
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diffToMonday);
  return todayISO(date);
}
