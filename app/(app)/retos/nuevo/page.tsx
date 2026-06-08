import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/lib/actions/leaderboard";
import RetoNuevoForm from "./RetoNuevoForm";

export const dynamic = "force-dynamic";

export default async function NuevoRetoPage() {
  const t = await getTranslations("retos");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ trato_id: string }>();
  if (!miembro) redirect("/retos");

  const miTratoId = miembro.trato_id;
  const res = await getLeaderboard("semana", false);
  const candidatos = (res.ok ? res.data : [])
    .filter((r) => r.trato_id !== miTratoId)
    .map((r) => ({ trato_id: r.trato_id, nombre: r.nombre_grupo }));

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
      <header className="flex justify-between items-start mb-8">
        <Link href="/" className="syne text-2xl lowercase tracking-tight">
          dovo
        </Link>
        <Link
          href="/retos"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          {t("back")}
        </Link>
      </header>

      <section className="mb-8">
        <h1 className="display text-3xl font-extrabold lowercase">
          {t("newTitle")}
        </h1>
        <p className="text-sm opacity-60 mt-2 max-w-md">{t("newSubtitle")}</p>
      </section>

      <RetoNuevoForm miTratoId={miTratoId} candidatos={candidatos} />
    </main>
  );
}
