import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GrupoForm from "./GrupoForm";

export const metadata = { title: "tu grupo · dovo" };
export const dynamic = "force-dynamic";

export default async function OnboardingGrupoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="min-h-svh max-w-xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
          paso 2 de 2
        </p>
        <h1 className="syne text-3xl lowercase">tu equipo</h1>
        <p className="text-sm opacity-70 mt-2">
          dovo es entre dos o más. crea tu grupo o únete a uno.
        </p>
      </header>
      <GrupoForm />
    </main>
  );
}
