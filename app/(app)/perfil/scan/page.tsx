import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import Paywall from "@/app/_components/Paywall";
import { getBodyScanContext } from "@/lib/actions/bodyscan";
import ScanFlow from "./_components/ScanFlow";

export const dynamic = "force-dynamic";
// Claude Vision puede tardar — extiende el límite de la ruta (igual que /nutricion).
export const maxDuration = 60;

export default async function ScanPage() {
  const t = await getTranslations("scan");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const ctx = await getBodyScanContext();

  if (!ctx.entitled) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
        <AppNav active="perfil" />
        <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        <Paywall feature="body_scan" title={t("paywallTitle")} blurb={t("paywallBlurb")} />
      </main>
    );
  }

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
      <AppNav active="perfil" />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <section className="mb-10">
        <ScanFlow live={ctx.live} />
      </section>

      {ctx.scans.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
            {t("historyTitle")}
          </h2>
          <ul className="space-y-2">
            {ctx.scans.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-4 rounded-xl border border-ink/10 px-4 py-3"
              >
                <span className="text-[10px] mono uppercase tracking-widest opacity-50 w-24 shrink-0">
                  {new Date(s.created_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="text-sm tabular-nums">
                  <span style={{ color: "#c44aff" }}>{s.grasa_pct}%</span>
                  <span className="opacity-40 mx-1">·</span>
                  <span className="opacity-70">{t("fat")}</span>
                </span>
                <span className="text-sm tabular-nums">
                  <span className="text-stat-vit">{s.musculo_pct}%</span>
                  <span className="opacity-40 mx-1">·</span>
                  <span className="opacity-70">{t("muscle")}</span>
                </span>
                {s.source === "ai" && (
                  <span className="ml-auto text-[9px] mono uppercase tracking-widest text-signal">
                    ✦
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[10px] mono uppercase tracking-[0.16em] opacity-40 max-w-md leading-relaxed mb-8">
        {t("disclaimer")}
      </p>

      <Link
        href="/perfil"
        className="text-[11px] mono uppercase tracking-[0.14em] opacity-60 hover:opacity-100 underline decoration-signal/40 underline-offset-4"
      >
        {t("back")}
      </Link>
    </main>
  );
}
