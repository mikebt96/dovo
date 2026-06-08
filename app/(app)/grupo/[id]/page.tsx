import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/utils/url";
import { BOOST_GATING_RACHAS } from "@/lib/scoring/constants";
import InviteLink from "./InviteLink";
import BoostButton from "@/app/_components/BoostButton";

export const dynamic = "force-dynamic";

type Grupo = {
  id: string;
  nombre_grupo: string;
  tipo_grupo: string;
  invite_token: string;
  created_by: string;
};

type Miembro = {
  user_id: string;
  role: string;
  users: { nombre: string } | null;
};

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const t = await getTranslations("grupo");
  const tOnb = await getTranslations("onboarding");
  const tLb = await getTranslations("leaderboard");
  const tRetos = await getTranslations("retos");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: grupo } = await supabase
    .schema("core")
    .from("tratos")
    .select("id, nombre_grupo, tipo_grupo, invite_token, created_by")
    .eq("id", id)
    .maybeSingle<Grupo>();

  if (!grupo) notFound();

  const { data: miembrosRaw } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("user_id, role, users!inner(nombre)")
    .eq("trato_id", id);

  const miembros = (miembrosRaw as unknown as Miembro[] | null) ?? [];
  const soyMiembro = miembros.some((m) => m.user_id === user.id);
  if (!soyMiembro) notFound();

  const inviteUrl = appUrl(`/invite/${grupo.invite_token}`);

  const { data: miMiembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id")
    .eq("trato_id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  let tieneRutina = false;
  if (miMiembro) {
    const { data: r } = await supabase
      .schema("core")
      .from("user_rutinas")
      .select("id")
      .eq("miembro_id", miMiembro.id)
      .eq("is_default", true)
      .maybeSingle<{ id: string }>();
    tieneRutina = !!r;
  }

  // Estado de boosts: racha del dúo (gating ≥ BOOST_GATING_RACHAS) + cooldown semanal.
  const { data: streakRow } = await supabase
    .schema("core")
    .from("trato_streak")
    .select("current_streak_weeks")
    .eq("trato_id", id)
    .maybeSingle<{ current_streak_weeks: number }>();
  const racha = streakRow?.current_streak_weeks ?? 0;

  const haceUnaSemana = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: boostReciente } = await supabase
    .schema("core")
    .from("boosts")
    .select("id")
    .eq("de_user", user.id)
    .eq("trato_id", id)
    .gt("fecha_otorgado", haceUnaSemana)
    .limit(1)
    .maybeSingle<{ id: string }>();
  const boostState: "ok" | "gate" | "cooldown" =
    racha < BOOST_GATING_RACHAS ? "gate" : boostReciente ? "cooldown" : "ok";

  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
            {t("eyebrow", { tipo: tOnb(`tipo.${grupo.tipo_grupo}`) })}
          </p>
          <h1 className="display text-3xl font-extrabold lowercase">{grupo.nombre_grupo}</h1>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          {t("back")}
        </Link>
      </header>

      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-widest opacity-60 mb-4">
          {t("members", { n: miembros.length })}
        </h2>
        <ul className="space-y-2">
          {miembros.map((m) => {
            const esPartner = m.user_id !== user.id;
            return (
              <li key={m.user_id} className="border-b border-ink/15 py-3">
                <div className="flex items-center justify-between">
                  <span className="display font-medium lowercase">
                    {m.users?.nombre ?? t("member")}
                  </span>
                  {m.role === "creator" && (
                    <span className="text-xs uppercase tracking-widest text-signal opacity-80">
                      {t("creator")}
                    </span>
                  )}
                </div>
                {esPartner && (
                  <div className="mt-2">
                    <BoostButton
                      tratoId={id}
                      paraUserId={m.user_id}
                      paraNombre={m.users?.nombre ?? t("member")}
                      state={boostState}
                      gateRacha={BOOST_GATING_RACHAS}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-10 flex flex-col sm:flex-row gap-3">
        <Link
          href="/leaderboard"
          className="flex-1 border border-ink/12 rounded-lg p-4 hover:border-signal transition-colors"
        >
          <span className="text-xs mono uppercase tracking-widest text-signal block mb-1">
            {tLb("navTab")}
          </span>
          <span className="text-sm opacity-70">{tLb("title")}</span>
        </Link>
        <Link
          href="/retos"
          className="flex-1 border border-ink/12 rounded-lg p-4 hover:border-signal transition-colors"
        >
          <span className="text-xs mono uppercase tracking-widest text-signal block mb-1">
            {tRetos("navTab")}
          </span>
          <span className="text-sm opacity-70">{tRetos("challenge")}</span>
        </Link>
      </section>

      <section className="border-t border-ink/15 pt-8 mb-10">
        <h2 className="display text-xl font-bold lowercase mb-3">{t("routineTitle")}</h2>
        <Link
          href={`/grupo/${id}/rutina`}
          className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {tieneRutina ? t("routineEdit") : t("routineCreate")}
        </Link>
      </section>

      <section className="border-t border-ink/15 pt-8">
        <h2 className="display text-xl font-bold lowercase mb-3">{t("inviteTitle")}</h2>
        <p className="text-sm opacity-70 mb-6">{t("inviteSubtitle")}</p>
        <InviteLink url={inviteUrl} />
      </section>
    </main>
  );
}
