import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getThemeOverride } from "@/lib/theme";
import { getDuoTier } from "@/lib/billing/tier";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import ProBadge from "@/app/_components/ProBadge";
import LanguageToggle from "@/app/_components/LanguageToggle";
import ThemeToggle from "@/app/_components/ThemeToggle";
import PulseOptOutToggle from "./_components/PulseOptOutToggle";
import PushSettings from "./_components/PushSettings";
import SaludPermisos from "./_components/SaludPermisos";
import SignOutButton from "./_components/SignOutButton";
import { getNotificationPrefs } from "@/lib/actions/push";
import { getEstadoSalud } from "@/lib/actions/salud";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const t = await getTranslations("ajustes");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: meRow } = await supabase
    .schema("core")
    .from("users")
    .select("nombre, email, pulse_opt_out")
    .eq("id", user.id)
    .maybeSingle();

  const optOut = (meRow?.pulse_opt_out as boolean | undefined) ?? false;
  const currentTheme = (await getThemeOverride()) ?? "system";
  const duo = await getDuoTier();
  const pushPrefs = await getNotificationPrefs();
  const estadoSalud = (await getEstadoSalud()) ?? { salud: false, ubicacion: false, fuentes: {} };

  return (
    <main className="min-h-svh max-w-2xl lg:max-w-4xl mx-auto px-6 py-10 bg-papel text-ink">
      <AppNav active="ajustes" />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} />

      <section className="border-t border-b border-ink/15 py-8 mb-10 space-y-4">
        <Row label={t("name")} value={meRow?.nombre ?? t("noName")} />
        <Row label={t("email")} value={meRow?.email ?? user.email ?? ""} />
      </section>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("plan")}</h2>
        <Link
          href="/suscripcion"
          className="flex items-center gap-3 rounded-xl border border-ink/12 p-4 hover:border-signal transition-colors"
        >
          <ProBadge tier={duo.tier} />
          <span className="ml-auto text-[11px] mono uppercase tracking-[0.14em] text-signal">
            {t("planView")}
          </span>
        </Link>
      </section>

      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("appearance")}</h2>
        <ThemeToggle current={currentTheme} />
      </section>

      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("language")}</h2>
        <LanguageToggle />
      </section>

      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("notifications")}</h2>
        <PushSettings initialPrefs={pushPrefs} />
      </section>

      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("saludPermisos")}</h2>
        <SaludPermisos initial={estadoSalud} />
      </section>

      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("pulse")}</h2>
        <PulseOptOutToggle initial={optOut} />
      </section>

      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("feedback")}</h2>
        <a
          href="mailto:miguel.butron06@gmail.com?subject=feedback%20dovo"
          className="text-sm underline decoration-signal/40 underline-offset-4 opacity-80 hover:opacity-100"
        >
          {t("feedbackLink")}
        </a>
      </section>

      <section className="mb-10">
        <h2 className="display text-xl font-bold lowercase mb-5">{t("legal")}</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link
            href="/privacidad"
            className="underline decoration-signal/40 underline-offset-4 opacity-80 hover:opacity-100"
          >
            {t("privacyLink")}
          </Link>
          <Link
            href="/terminos"
            className="underline decoration-signal/40 underline-offset-4 opacity-80 hover:opacity-100"
          >
            {t("termsLink")}
          </Link>
        </nav>
      </section>
      </div>

      {/* Consola — solo visible para el admin (es-only, superficie interna) */}
      {isAdminEmail(user.email) && (
        <section className="mb-10">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl border border-ink/12 p-4 hover:border-signal transition-colors"
          >
            <span className="text-[10px] mono uppercase tracking-[0.18em] opacity-60">
              ⚙ consola del sistema
            </span>
            <span className="ml-auto text-[11px] mono uppercase tracking-[0.14em] text-signal">
              abrir →
            </span>
          </Link>
        </section>
      )}

      <section className="pt-8 border-t border-ink/15">
        <SignOutButton />
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] mono uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
