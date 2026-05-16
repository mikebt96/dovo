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

const MONTH_ABBR = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

export function folioDate(d: Date = new Date()): string {
  return `${pad(d.getDate(), 2)}·${MONTH_ABBR[d.getMonth()]}`;
}

export function folioSerial(profileId: string, dayKey?: DayKey): string {
  const d = new Date();
  const w = pad(isoWeek(d), 2);
  const profileTag = profileId.slice(0, 2).toUpperCase();
  const dayTag = dayKey ? `·${dayKey.toUpperCase()}` : "";
  const doy = pad(dayOfYear(d), 3);
  return `W${w}·${profileTag}${dayTag}·${doy}`;
}
