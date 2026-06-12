import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import ProBadge from "@/app/_components/ProBadge";
import Paywall from "@/app/_components/Paywall";
import GameIcon, { type GameIconName } from "@/app/_components/GameIcon";
import { getDuoTier } from "@/lib/billing/tier";
import PlanGrid from "./_components/PlanGrid";
import ManageButton from "./_components/ManageButton";

export const dynamic = "force-dynamic";

export default async function SuscripcionPage() {
  const t = await getTranslations("suscripcion");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const duo = await getDuoTier();

  if (!duo.tratoId) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-4xl mx-auto">
        <AppNav />
        <PageHero
          eyebrow={t("eyebrow")}
          title={t("noDuoTitle")}
          subtitle={t("noDuoBody")}
        />
        <Link
          href="/onboarding/grupo"
          className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {t("noDuoCta")}
        </Link>
      </main>
    );
  }

  const isPaid = duo.tier !== "free";
  const periodEnd = duo.currentPeriodEnd
    ? new Date(duo.currentPeriodEnd).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-4xl mx-auto">
      <AppNav />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {/* Plan actual */}
      <section className="rounded-2xl border border-ink/12 p-5 mb-10 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[11px] mono uppercase tracking-[0.18em] opacity-50">
          {t("currentPlan")}
        </span>
        <ProBadge tier={duo.tier} />
        {duo.isDemo ? (
          <span className="text-xs opacity-60">{t("demoNote")}</span>
        ) : isPaid ? (
          <>
            {periodEnd && (
              <span className="text-xs opacity-60">
                {duo.cancelAtPeriodEnd
                  ? t("endsOn", { date: periodEnd })
                  : t("renewsOn", { date: periodEnd })}
              </span>
            )}
            <span className="ml-auto">
              <ManageButton billingEnabled={duo.billingEnabled} />
            </span>
          </>
        ) : (
          <span className="text-xs opacity-60">{t("freeNote")}</span>
        )}
      </section>

      <PlanGrid currentTier={duo.tier} billingEnabled={duo.billingEnabled} />

      {/* Lo que desbloqueas con Pro — demostración in-situ del <Paywall> (gating infra) */}
      <section className="mt-14">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-60 mb-5">
          {t("unlocksTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Paywall
            feature="nutrition"
            title={t("nutritionTitle")}
            blurb={t("nutritionBlurb")}
            preview={<ProPreviewCard icon="plato" title={t("nutritionTitle")} body={t("nutritionBlurb")} />}
          />
          <Paywall
            feature="body_scan"
            title={t("bodyScanTitle")}
            blurb={t("bodyScanBlurb")}
            preview={<ProPreviewCard icon="camara" title={t("bodyScanTitle")} body={t("bodyScanBlurb")} />}
          />
        </div>
      </section>
    </main>
  );
}

// Tarjeta-teaser de una feature Pro. Sirve de `preview` del Paywall: cuando el dúo tiene
// acceso (demo=pro) se ve limpia; si no, el Paywall la atenúa y encima pone el gate.
function ProPreviewCard({
  icon,
  title,
  body,
}: {
  icon: GameIconName;
  title: string;
  body: string;
}) {
  return (
    <div className="p-6">
      <div className="mb-3">
        <GameIcon name={icon} size={28} />
      </div>
      <div className="flex items-center gap-2">
        <span className="display font-semibold lowercase">{title}</span>
        <ProBadge tier="pro" />
      </div>
      <p className="text-sm opacity-60 mt-2 leading-relaxed">{body}</p>
    </div>
  );
}
