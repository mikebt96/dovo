// Juice compartido (F23·G7, directiva §3): háptica con las magnitudes vigentes
// y detección de reduced-motion. Android-only la vibración (iOS no vibra jamás:
// el feedback visual nunca depende de esto). Client-safe.
export function vibrateTap(): void {
  if (typeof navigator !== "undefined") navigator.vibrate?.(12);
}
export function vibrateJackpot(): void {
  if (typeof navigator !== "undefined") navigator.vibrate?.([40, 40, 90]);
}
export function vibrateHit(blocked: boolean): void {
  if (typeof navigator !== "undefined") navigator.vibrate?.(blocked ? 30 : 15);
}
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
