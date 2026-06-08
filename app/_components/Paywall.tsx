import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getEntitlement } from "@/lib/billing/tier";
import type { Feature } from "@/lib/billing/tiers";
import ProBadge from "./ProBadge";

// <Paywall> · gate por tier, FAIL-SOFT y editorial (DESIGN.md, no agresivo). Contrato:
//   · entitled (incl. demo=pro)        → renderiza children (la feature real).
//   · NO entitled + billing OFF        → preview atenuado + cinta "próximamente" (NUNCA bloquea duro).
//   · NO entitled + billing ON         → preview atenuado + CTA "desbloquea con Pro" → /suscripcion.
// `preview` es el sample fail-soft (p.ej. el meal plan determinista de F5). Si no se pasa,
// el gate se muestra solo. Es un Server Component: resuelve el tier server-side.
export default async function Paywall({
  feature,
  children,
  preview,
  title,
  blurb,
}: {
  feature: Feature;
  children?: ReactNode;
  preview?: ReactNode;
  title?: string;
  blurb?: string;
}) {
  const t = await getTranslations("paywall");
  const { entitled, required, current } = await getEntitlement(feature);

  if (entitled) return <>{children ?? preview}</>;

  const comingSoon = !current.billingEnabled;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink/10">
      {preview && (
        <div
          aria-hidden
          className="pointer-events-none select-none opacity-[0.45] blur-[1px]"
        >
          {preview}
        </div>
      )}
      <div
        className={
          preview
            ? "absolute inset-0 flex items-center justify-center bg-papel/55 backdrop-blur-[2px] p-6"
            : "p-6"
        }
      >
        <div className="max-w-sm text-center">
          <div className="flex justify-center mb-3">
            <ProBadge tier={required} />
          </div>
          <p className="display text-xl font-bold lowercase">
            {title ?? t("defaultTitle")}
          </p>
          <p className="text-sm opacity-65 mt-2 leading-relaxed">
            {blurb ?? t("defaultBlurb")}
          </p>
          <div className="mt-5">
            {comingSoon ? (
              <Link
                href="/suscripcion"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm mono uppercase tracking-[0.14em] border border-signal/40 bg-signal/[0.06] text-signal hover:bg-signal/[0.12] transition-colors"
              >
                🔔 {t("comingSoon")}
              </Link>
            ) : (
              <Link
                href="/suscripcion"
                className="inline-flex items-center rounded-full bg-ink text-papel px-6 py-3 display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
              >
                {t("unlock")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
