import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/utils/url";
import { BOOST_GATING_RACHAS } from "@/lib/scoring/constants";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
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

  const { data: grupo, error: grupoErr } = await supabase
    .schema("core")
    .from("tratos")
    .select("id, nombre_grupo, tipo_grupo, invite_token, created_by")
    .eq("id", id)
    .maybeSingle<Grupo>();
  // F25·G20: un fallo transitorio NO es 404 — al error boundary, no a notFound.
  if (grupoErr) throw grupoErr;

  if (!grupo) notFound();

  const { data: miembrosRaw, error: miembrosErr } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("user_id, role, users!inner(nombre)")
    .eq("trato_id", id);
  if (miembrosErr) throw miembrosErr;

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
    <main className="min-h-svh max-w-2xl lg:max-w-4xl mx-auto px-6 py-10 bg-papel text-ink">
      <AppNav />
      <PageHero
        eyebrow={t("eyebrow", { tipo: tOnb(`tipo.${grupo.tipo_grupo}`) })}
        title={grupo.nombre_grupo}
      />

      <section className="mb-10">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
          {t("members", { n: miembros.length })}
        </h2>
        <ul className="space-y-2">
          {miembros.map((m) => {
            const esPartner = m.user_id !== user.id;
            const nombre = m.users?.nombre ?? t("member");
            const inicial = nombre.trim().charAt(0).toUpperCase() || "·";
            return (
              <li
                key={m.user_id}
                className="flex items-start gap-3.5 rounded-xl border border-ink/10 p-4"
              >
                <span className="grid place-items-center w-10 h-10 rounded-full bg-signal/12 text-signal display font-bold text-lg shrink-0">
                  {inicial}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="display font-semibold lowercase truncate">
                      {nombre}
                    </span>
                    {m.role === "creator" && (
                      <span className="text-[10px] mono uppercase tracking-widest text-signal shrink-0">
                        {t("creator")}
                      </span>
                    )}
                  </div>
                  {esPartner && (
                    <div className="mt-2">
                      <BoostButton
                        tratoId={id}
                        paraUserId={m.user_id}
                        paraNombre={nombre}
                        state={boostState}
                        gateRacha={BOOST_GATING_RACHAS}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-10 flex flex-col sm:flex-row gap-3">
        <Link
          href="/leaderboard"
          className="group flex-1 rounded-xl border border-ink/10 p-5 transition-all hover:border-signal hover:-translate-y-0.5"
        >
          <span className="text-[11px] mono uppercase tracking-[0.18em] text-signal block mb-1.5">
            {tLb("navTab")}
          </span>
          <span className="display font-semibold lowercase flex items-center gap-2">
            {tLb("title")}
            <span className="opacity-40 transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
        <Link
          href="/retos"
          className="group flex-1 rounded-xl border border-ink/10 p-5 transition-all hover:border-signal hover:-translate-y-0.5"
        >
          <span className="text-[11px] mono uppercase tracking-[0.18em] text-signal block mb-1.5">
            {tRetos("navTab")}
          </span>
          <span className="display font-semibold lowercase flex items-center gap-2">
            {tRetos("challenge")}
          </span>
        </Link>
      </section>

      <section className="rounded-2xl border border-ink/10 p-6 mb-4">
        <h2 className="display text-xl font-bold lowercase mb-4">
          {t("routineTitle")}
        </h2>
        <Link
          href={`/grupo/${id}/rutina`}
          className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {tieneRutina ? t("routineEdit") : t("routineCreate")}
        </Link>
      </section>

      <section className="rounded-2xl border border-ink/10 p-6">
        <h2 className="display text-xl font-bold lowercase mb-2">
          {t("inviteTitle")}
        </h2>
        <p className="text-sm opacity-60 mb-5">{t("inviteSubtitle")}</p>
        <InviteLink url={inviteUrl} />
      </section>
    </main>
  );
}
