import type { ReactNode } from "react";
import type { ProfileId } from "@/lib/types";

/* ---------- Plate badge: ⊕ MIKE / ⊕ ANDY / ⊛ JUNTOS ---------- */

export function Plate({
  who,
  children,
  glyph,
}: {
  who: ProfileId | "both";
  children?: ReactNode;
  glyph?: string;
}) {
  const cls =
    who === "mike" ? "plate plate-mike"
    : who === "andy" ? "plate plate-andy"
    : "plate plate-both";
  const defaultGlyph = who === "both" ? "⊛" : "⊕";
  const label =
    children ?? (who === "mike" ? "Mike" : who === "andy" ? "Andy" : "Juntos");
  return (
    <span className={cls}>
      <span className="plate-glyph">{glyph ?? defaultGlyph}</span>
      {label}
    </span>
  );
}

/* ---------- Folio: page-top header with serial + reg-marks ---------- */

export function Folio({
  serial,
  title,
  right,
}: {
  serial: string;
  title?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="folio">
      <span className="flex items-center gap-3">
        <span className="folio-mark">⊕</span>
        <span className="folio-num">N.º {serial}</span>
        {title && <span className="text-[color:var(--color-ink-mute)]">· {title}</span>}
      </span>
      <span className="flex items-center gap-3">
        {right}
        <span className="folio-mark">⊕</span>
      </span>
    </header>
  );
}

/* ---------- Ticket: notched receipt container ---------- */

export function Ticket({
  children,
  flat = false,
  className = "",
}: {
  children: ReactNode;
  flat?: boolean;
  className?: string;
}) {
  return (
    <section className={`${flat ? "ticket-flat" : "ticket"} ${className}`}>
      {children}
    </section>
  );
}

export function TicketHead({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="ticket-head">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mono text-[10px] text-[color:var(--color-ink-mute)] mb-1">
            {eyebrow}
          </p>
        )}
        <h2
          className="text-lg md:text-xl font-extrabold tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
      </div>
      {right && <div className="flex-shrink-0 text-right">{right}</div>}
    </header>
  );
}

export function TicketBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`ticket-body ${className}`}>{children}</div>;
}

export function TicketFoot({
  serial,
  action,
}: {
  serial?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <footer className="ticket-foot">
      <span className="flex items-center gap-2 text-[color:var(--color-ink-mute)]">
        <span className="text-[color:var(--color-overprint)]">⊛</span>
        {serial}
      </span>
      {action}
    </footer>
  );
}

/* ---------- Perforated divider ---------- */

export function Perforated({ thick = false }: { thick?: boolean }) {
  return (
    <div
      className={thick ? "perforated-thick" : "perforated"}
      aria-hidden="true"
    />
  );
}

/* ---------- Leader row: KCAL · · · · · · · · · 2400 ---------- */

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
    <div className="leader-row">
      <span className="label">{label}</span>
      <span className="leader" aria-hidden="true"></span>
      <span className="value" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  );
}

/* ---------- Stamp: italic serif, rotated, vermillion ---------- */

export function Stamp({
  children,
  variant,
  sm,
}: {
  children: ReactNode;
  variant?: "paid" | "overdue" | "warn";
  sm?: boolean;
}) {
  const v =
    variant === "paid" ? "stamp-paid"
    : variant === "overdue" ? "stamp-overdue"
    : variant === "warn" ? "stamp-warn"
    : "";
  return <span className={`stamp ${v} ${sm ? "stamp-sm" : ""}`}>{children}</span>;
}

/* ---------- Block progress: ▓▓▓▓▓▓░░░░ N/M ---------- */

export function BlockProgress({
  value,
  max,
  width = 14,
  showCount = true,
  label,
}: {
  value: number;
  max: number;
  width?: number;
  showCount?: boolean;
  label?: ReactNode;
}) {
  const pct = max === 0 ? 0 : Math.min(1, value / max);
  const filled = Math.round(pct * width);
  const empty = width - filled;
  return (
    <p className="block-progress flex items-center gap-3 flex-wrap">
      <span aria-hidden="true">
        <span className="fill">{"▓".repeat(filled)}</span>
        <span>{"░".repeat(empty)}</span>
      </span>
      {showCount && (
        <span className="mono text-[10px] text-[color:var(--color-ink-soft)]">
          {value}/{max}{label ? ` · ${label}` : ""}
        </span>
      )}
    </p>
  );
}

/* ---------- Marginalia ---------- */

export function Marginalia({
  tag,
  children,
}: {
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="marginalia">
      {tag && <span className="tag">{tag}</span>}
      {children}
    </aside>
  );
}

/* ---------- Rule with serial ---------- */

export function RuleWithMark({ children }: { children: ReactNode }) {
  return (
    <div
      className="rule-with-mark mono text-[10px] tracking-widest uppercase"
    >
      {children}
    </div>
  );
}

/* ---------- Stat cluster: dot-leader rows in a tight block ---------- */

export function StatLedger({
  rows,
}: {
  rows: Array<{ label: ReactNode; value: ReactNode; accent?: string }>;
}) {
  return (
    <div className="divide-y divide-[color:var(--color-rule)]">
      {rows.map((r, i) => (
        <LeaderRow key={i} label={r.label} value={r.value} accent={r.accent} />
      ))}
    </div>
  );
}
