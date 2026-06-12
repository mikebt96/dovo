import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/lib/actions/leaderboard";
import { getHeadToHead } from "@/lib/actions/retos";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
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
  // Scouting (directiva §5 retos): el leaderboard YA trae racha/clase/top_stat
  // de cada dúo — antes se tiraban. Cada candidato es una mini-carta de juego.
  const rows = (res.ok ? res.data : []).filter((r) => r.trato_id !== miTratoId);
  const h2hs = await Promise.all(rows.map((r) => getHeadToHead(miTratoId, r.trato_id)));
  const candidatos = rows.map((r, i) => ({
    trato_id: r.trato_id,
    nombre: r.nombre_grupo,
    racha: r.racha_duo,
    clase: r.top_clase,
    topStat: r.top_stat,
    h2h: h2hs[i],
  }));

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-4xl mx-auto">
      <AppNav />
      <PageHero eyebrow={t("eyebrow")} title={t("newTitle")} subtitle={t("newSubtitle")} />

      <RetoNuevoForm miTratoId={miTratoId} candidatos={candidatos} />
    </main>
  );
}
