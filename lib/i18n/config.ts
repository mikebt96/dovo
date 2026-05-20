// i18n config — cookie-based locale (no URL routing). See docs/specs/DESIGN.md §11.
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es"; // MX-first; cookie always overrides.
export const LOCALE_COOKIE = "dovo-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}
