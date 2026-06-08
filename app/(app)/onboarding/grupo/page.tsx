import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import LanguageToggle from "@/app/_components/LanguageToggle";
import OnboardingProgress from "@/app/_components/OnboardingProgress";
import GrupoForm from "./GrupoForm";
import DuoProof from "@/app/_components/DuoProof";

export const dynamic = "force-dynamic";

export default async function OnboardingGrupoPage() {
  const t = await getTranslations("onboarding");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="min-h-svh bg-papel text-ink">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="syne text-2xl lowercase tracking-tight hover:text-signal transition-colors"
          >
            dovo
          </Link>
          <LanguageToggle />
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div className="mb-10 lg:mb-0 lg:sticky lg:top-10">
            <OnboardingProgress step={2} />
            <p className="text-[11px] mono uppercase tracking-[0.22em] text-signal mb-3 mt-6">
              {t("step2")}
            </p>
            <h1 className="display font-extrabold lowercase leading-[0.9] tracking-[-0.03em] text-[clamp(2.5rem,7vw,4rem)] text-balance">
              {t("grupoTitle")}
            </h1>
            <p className="text-sm sm:text-base opacity-60 mt-4 max-w-sm leading-relaxed">
              {t("grupoSubtitle")}
            </p>
            <div className="hidden lg:block mt-12">
              <DuoProof />
            </div>
          </div>

          <div className="lg:pt-1">
            <GrupoForm />
            <div className="lg:hidden mt-12">
              <DuoProof />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
