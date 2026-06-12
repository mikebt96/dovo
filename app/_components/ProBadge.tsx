import type { Tier } from "@/lib/billing/tiers";

// Badge de tier consistente app-wide. Pro = signal violeta; Premium = panel oscuro premium;
// Free = hairline discreto. Presentacional puro (server-safe).
export default function ProBadge({
  tier,
  className = "",
}: {
  tier: Tier;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] mono uppercase tracking-[0.18em] leading-none";
  if (tier === "premium") {
    return (
      <span
        className={`${base} text-white ${className}`}
        style={{
          background:
            "var(--surface-game)",
          boxShadow: "0 6px 20px -10px rgba(109,74,255,0.7)",
        }}
      >
        ◆ premium
      </span>
    );
  }
  if (tier === "pro") {
    return (
      <span className={`${base} bg-signal text-white ${className}`}>↗ pro</span>
    );
  }
  return (
    <span className={`${base} border border-ink/20 opacity-60 ${className}`}>
      gratis
    </span>
  );
}
