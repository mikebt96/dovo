import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PerfilForm from "./PerfilForm";

export const metadata = { title: "tu perfil · dovo" };
export const dynamic = "force-dynamic";

export default async function OnboardingPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="min-h-svh max-w-xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
          paso 1 de 2
        </p>
        <h1 className="syne text-3xl lowercase">cuéntanos de ti</h1>
        <p className="text-sm opacity-70 mt-2">
          con esto calculamos tu metabolismo y ajustamos tus metas.
        </p>
      </header>
      <PerfilForm />
    </main>
  );
}
