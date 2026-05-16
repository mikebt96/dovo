import type { ReactNode } from "react";
import Link from "next/link";
import type { ProfileId } from "@/lib/types";

/* ============ RoleDot — tiny indicator for ownership ============ */

export function RoleDot({
  who,
  className = "",
}: {
  who: ProfileId | "both";
  className?: string;
}) {
  const cls =
    who === "mike" ? "role-dot-mike"
    : who === "andy" ? "role-dot-andy"
    : "role-dot-both";
  return <span className={`role-dot ${cls} ${className}`} aria-hidden="true" />;
}

/* ============ Eyebrow — small caps with dot separators ============ */

export function Eyebrow({
  children,
  parts,
  className = "",
}: {
  children?: ReactNode;
  parts?: string[];
  className?: string;
}) {
  if (parts) {
    return (
      <p className={`eyebrow ${className}`}>
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[color:var(--color-text-4)]">·</span>}
            <span>{p}</span>
          </span>
        ))}
      </p>
    );
  }
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/* ============ SectionLabel — top of a content section ============ */

export function SectionLabel({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="section-label">
      <span className="flex-1">{children}</span>
      {right && <span className="text-[color:var(--color-text-2)] normal-case tracking-normal">{right}</span>}
    </header>
  );
}

/* ============ BigStat — label + massive number ============ */

export function BigStat({
  label,
  value,
  unit,
  sub,
  accent,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={`big-stat ${className}`}>
      <span className="label">{label}</span>
      <p className="num" style={accent ? { color: accent } : undefined}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </p>
      {sub && <span className="sub">{sub}</span>}
    </div>
  );
}

/* ============ MetricBar — thin horizontal progress ============ */

export function MetricBar({
  value,
  max,
  accent,
  className = "",
}: {
  value: number;
  max: number;
  accent?: string;
  className?: string;
}) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className={`metric-bar ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <span
        style={{
          width: `${pct}%`,
          ...(accent ? { background: accent } : undefined),
        }}
      />
    </div>
  );
}

/* ============ MetricRing — SVG circular progress ============ */

export function MetricRing({
  value,
  max,
  size = 96,
  stroke = 6,
  accent = "var(--color-accent)",
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  accent?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = max === 0 ? 0 : Math.min(1, value / max);
  const dash = circ * (1 - pct);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

/* ============ BracketLink — [ label → ] minimal CTA ============ */

export function BracketLink({
  href,
  children,
  external = false,
  onClick,
  type,
}: {
  href?: string;
  children: ReactNode;
  external?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  if (href) {
    return (
      <Link
        href={href}
        className="bracket-link"
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className="bracket-link">
      {children}
    </button>
  );
}

/* ============ DayHero — full-bleed hero for /[profile] and day pages ============ */

export function DayHero({
  eyebrow,
  title,
  focus,
  cta,
  accent,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  focus?: ReactNode;
  cta?: ReactNode;
  accent?: string;
}) {
  return (
    <section className="day-hero">
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <div className="flex items-end justify-between flex-wrap gap-6">
        <h1 className="lowercase" style={accent ? { color: accent } : undefined}>
          {title}
        </h1>
        {focus && (
          <p
            className="mono text-xs tracking-[0.22em] mb-4"
            style={{ color: "var(--color-accent)" }}
          >
            {focus}
          </p>
        )}
      </div>
      {cta && <div className="mt-8">{cta}</div>}
    </section>
  );
}

/* ============ GlassBar — top sticky header surface ============ */

export function GlassBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header className={`sticky top-0 z-20 glass ${className}`}>
      {children}
    </header>
  );
}

/* ============ Surface — minimal content panel ============ */

export function Surface({
  children,
  strong = false,
  className = "",
}: {
  children: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={`${strong ? "surface-strong" : "surface"} ${className}`}>
      {children}
    </div>
  );
}

/* ============ LeaderRow — kept as utility for ledger-style stats ============ */

export function LeaderRow({
  label,
  value,
  accent,
}: {
  label: ReactNode;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 py-2 border-b border-[color:var(--color-divider)] last:border-b-0">
      <span className="mono text-xs text-[color:var(--color-text-3)] tracking-[0.14em] uppercase">
        {label}
      </span>
      <span className="flex-1 h-px bg-[color:var(--color-divider)] mb-1" />
      <span
        className="font-bold tabular text-sm"
        style={accent ? { color: accent } : { color: "var(--color-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ============ HRule — minimal divider ============ */

export function HRule({ className = "" }: { className?: string }) {
  return <hr className={`hr-thin ${className}`} aria-hidden="true" />;
}
