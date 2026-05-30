import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
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
    <main className="min-h-svh max-w-xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-2">{t("step2")}</p>
        <h1 className="display text-3xl font-extrabold lowercase">{t("grupoTitle")}</h1>
        <p className="text-sm opacity-70 mt-2">{t("grupoSubtitle")}</p>
      </header>
      <GrupoForm />
      <div className="mt-12">
        <DuoProof />
      </div>
    </main>
  );
}
