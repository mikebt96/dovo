import type { CSSProperties, ReactNode } from "react";

/* ============ Mark — dos discos paralelos ============
   Geometría: d=10, gap edge-to-edge=4, center-to-center=14 (ratio 1.4)
   viewBox 24×10 — alto = d, ancho = 2d + gap                          */

export interface MarkProps {
  variant?: "solid" | "outline";
  size?: number;          // altura en px (el ancho se calcula 2.4× la altura)
  color?: string;         // CSS color o var()
  className?: string;
  ariaLabel?: string;
}

export function Mark({
  variant = "solid",
  size = 20,
  color = "currentColor",
  className = "",
  ariaLabel = "dovo",
}: MarkProps) {
  const stroke = variant === "outline" ? 1.2 : 0;
  const r = (10 - stroke) / 2;
  return (
    <svg
      width={size * 2.4}
      height={size}
      viewBox="0 0 24 10"
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <circle
        cx={5}
        cy={5}
        r={r}
        fill={variant === "solid" ? color : "none"}
        stroke={variant === "outline" ? color : "none"}
        strokeWidth={stroke}
      />
      <circle
        cx={19}
        cy={5}
        r={r}
        fill={variant === "solid" ? color : "none"}
        stroke={variant === "outline" ? color : "none"}
        strokeWidth={stroke}
      />
    </svg>
  );
}

/* ============ Wordmark — "dovo" tipográfico canónico ============
   Syne ExtraBold 800, lowercase, tracking apretado.
   Tamaños mapeados a contextos reales del producto.                  */

type WordmarkSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<WordmarkSize, string> = {
  sm: "0.95rem",                          // footer, captions
  md: "1.05rem",                          // header bars, nav
  lg: "1.5rem",                           // page intros
  xl: "clamp(3rem, 9vw, 5.5rem)",         // hero
};

export interface WordmarkProps {
  size?: WordmarkSize;
  as?: "span" | "p" | "h1" | "h2";
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function Wordmark({
  size = "md",
  as: Component = "span",
  color = "var(--color-text)",
  className = "",
  style,
}: WordmarkProps) {
  return (
    <Component
      className={`font-extrabold lowercase tracking-tight ${className}`}
      style={{
        fontFamily: "var(--font-display)",
        letterSpacing: "-0.02em",
        fontSize: SIZE_MAP[size],
        color,
        lineHeight: 1,
        ...style,
      }}
    >
      dovo
    </Component>
  );
}

/* ============ Logo — Mark + Wordmark lockup ============
   horizontal · stacked · mark-only · wordmark-only                  */

export interface LogoProps {
  layout?: "horizontal" | "stacked" | "mark-only" | "wordmark-only";
  size?: WordmarkSize;
  variant?: "solid" | "outline";
  color?: string;
  suffix?: ReactNode;                     // para "dovo · juntos", "dovo · carnet"
  suffixColor?: string;
  className?: string;
}

const MARK_PX: Record<WordmarkSize, number> = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 56,
};

export function Logo({
  layout = "horizontal",
  size = "md",
  variant = "solid",
  color = "var(--color-text)",
  suffix,
  suffixColor = "var(--color-accent)",
  className = "",
}: LogoProps) {
  const markSize = MARK_PX[size];

  if (layout === "mark-only") {
    return <Mark size={markSize} variant={variant} color={color} className={className} />;
  }
  if (layout === "wordmark-only") {
    return (
      <span className={`inline-flex items-baseline gap-2 ${className}`}>
        <Wordmark size={size} color={color} />
        {suffix && (
          <span
            className="mono text-[10px] tracking-widest"
            style={{ color: suffixColor }}
          >
            · {suffix}
          </span>
        )}
      </span>
    );
  }
  if (layout === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <Mark size={markSize * 1.4} variant={variant} color={color} />
        <Wordmark size={size} color={color} />
        {suffix && (
          <span
            className="mono text-[10px] tracking-widest"
            style={{ color: suffixColor }}
          >
            {suffix}
          </span>
        )}
      </span>
    );
  }
  // horizontal default
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={markSize} variant={variant} color={color} />
      <Wordmark size={size} color={color} />
      {suffix && (
        <span
          className="mono text-[10px] tracking-widest"
          style={{ color: suffixColor }}
        >
          · {suffix}
        </span>
      )}
    </span>
  );
}
