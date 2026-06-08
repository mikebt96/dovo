import type { ReactNode } from "react";

// Encabezado editorial reutilizable (DESIGN.md §8 "big type is the layout").
// Eyebrow mono en signal + titular oversized (clamp) + subtítulo. Server-safe.
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  align = "start",
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "start" | "between";
  children?: ReactNode;
}) {
  return (
    <section className="mb-9">
      <div
        className={
          align === "between"
            ? "flex items-end justify-between gap-4"
            : undefined
        }
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] mono uppercase tracking-[0.22em] text-signal mb-3">
              {eyebrow}
            </p>
          )}
          <h1 className="display font-extrabold lowercase leading-[0.9] tracking-[-0.03em] text-[clamp(2.5rem,7vw,4rem)] text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base opacity-60 mt-4 max-w-md leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {align === "between" && children}
      </div>
      {align !== "between" && children}
    </section>
  );
}
