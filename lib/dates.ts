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
