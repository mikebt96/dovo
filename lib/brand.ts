/**
 * Tokens de marca dovo — fuente única de verdad.
 *
 * Para uso en server-only contexts donde no se puede leer CSS variables
 * (next/og ImageResponse, route handlers que generan imágenes, etc.).
 * Los componentes de cliente deben preferir las CSS vars (--color-text,
 * --color-accent, etc.) que ya están definidas en globals.css.
 */

/* ============ Color tokens ============ */

export const COLOR = {
  /** Tinta principal — usado en wordmark + mark sobre fondo claro */
  ink: "#0e0d11",
  /** Crema editorial — fondo de favicon, apple-icon, OG image */
  cream: "#f4ede0",
  /** Texto secundario sobre crema (tagline OG, metadata mono) */
  mute: "#6e6358",
  /** Glass dark bg — coincide con themeColor del viewport */
  glassDark: "#08080a",
} as const;

/* ============ Mark geometry ============ */

/**
 * El mark (dos discos paralelos) usa siempre el mismo viewBox lógico.
 * d=10, gap=4, total 24×10. Ratio 2.4:1.
 *
 * Para SVG inline en componentes React: usar viewBox "0 0 24 10".
 * Para canvas absoluto (apple-icon, favicon): ver `markAt()`.
 */
export const MARK = {
  viewBox: "0 0 24 10",
  d: 10,
  gap: 4,
  width: 24,
  height: 10,
  /** Centros de cada disco en coordenadas del viewBox */
  centers: [
    { cx: 5, cy: 5 },
    { cx: 19, cy: 5 },
  ],
  /** Radio default (solid) */
  r: 5,
} as const;
