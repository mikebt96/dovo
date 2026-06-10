import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import DuelScoreboard from "@/app/_components/DuelScoreboard";
import {
  getRetosDeTrato,
  getMarcador,
  type Marcador,
  type RetoRow,
} from "@/lib/actions/retos";
import { getDuelContext } from "@/lib/actions/ataques";
import AttackPanel from "./_components/AttackPanel";
import DuelFeed from "./_components/DuelFeed";

export const dynamic = "force-dynamic";

export default async function RetosPage() {
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

  if (!miembro) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
        <AppNav active="retos" />
        <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("emptyBody")} />
        <Link
          href="/onboarding/grupo"
          className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {t("emptyCta")}
        </Link>
      </main>
    );
  }

  const miTratoId = miembro.trato_id;
  const retos = await getRetosDeTrato(miTratoId);
  const marcadores = await Promise.all(retos.map((r) => getMarcador(r.id)));
  const pairs = retos
    .map((r, i) => ({ r, m: marcadores[i].ok ? marcadores[i].data : null }))
    .filter((x): x is { r: RetoRow; m: Marcador } => x.m !== null);

  const activos = pairs.filter((p) =>
    ["propuesto", "aceptado", "activo"].includes(p.r.estado),
  );
  const historial = pairs.filter((p) => p.r.estado === "cerrado");

  // F10 · Contexto de ataque por duelo realmente activo (munición, rivales, feed).
  const enCurso = activos.filter((p) => p.r.estado === "activo");
  const contextos = await Promise.all(
    enCurso.map((p) => getDuelContext(p.r.id, miTratoId)),
  );
  const ctxDe = new Map(enCurso.map((p, i) => [p.r.id, contextos[i]]));

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-5xl mx-auto">
      <AppNav active="retos" />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {activos.length > 0 && (
        <section className="space-y-8 mb-8">
          {activos.map(({ r, m }) => {
            const ctx = ctxDe.get(r.id);
            const nombresDuo: Record<string, string> = {
              [m.trato_a]: m.nombre_a,
              [m.trato_b]: m.nombre_b,
            };
            return (
              <div key={r.id} className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start">
                <div className="space-y-4">
                  <div className="anim-fade-up">
                    <DuelScoreboard
                      m={m}
                      miTratoId={miTratoId}
                      canRespond={r.creado_por !== user.id}
                    />
                  </div>
                  {ctx && (
                    <div className="rounded-2xl border border-ink/12 p-5">
                      <h3 className="text-[11px] mono uppercase tracking-[0.22em] opacity-50 mb-3">
                        {t("atkTitle")}
                      </h3>
                      <AttackPanel
                        retoId={r.id}
                        municion={ctx.municion}
                        yaAtacoHoy={ctx.yaAtacoHoy}
                        rivales={ctx.rivales}
                      />
                    </div>
                  )}
                </div>
                {ctx && (
                  <div className="mt-4 lg:mt-0">
                    <DuelFeed
                      ataques={ctx.ataques}
                      miembros={ctx.miembros}
                      nombresDuo={nombresDuo}
                      congelados={ctx.congelados}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <Link
        href="/retos/nuevo"
        className="anim-lift group block rounded-2xl border border-dashed border-signal/40 p-6 mb-10 transition-colors hover:border-signal hover:bg-signal/[0.04]"
      >
        <span className="text-[11px] mono uppercase tracking-[0.18em] text-signal">
          {t("active")}
        </span>
        <span className="mt-1 block display font-semibold lowercase text-lg transition-colors group-hover:text-signal">
          {t("emptyCta")}
        </span>
      </Link>

      {historial.length > 0 && (
        <section>
          <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
            {t("history")}
          </h2>
          <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {historial.map(({ r, m }, i) => {
              const mineIsA = m.trato_a === miTratoId;
              const rivalNombre = mineIsA ? m.nombre_b : m.nombre_a;
              const result =
                r.ganador_trato_id === null
                  ? "tied"
                  : r.ganador_trato_id === miTratoId
                    ? "won"
                    : "lost";
              const accent =
                result === "won"
                  ? "bg-signal"
                  : result === "tied"
                    ? "bg-ink/30"
                    : "bg-ink/15";
              const resultClass =
                result === "won"
                  ? "text-signal"
                  : result === "lost"
                    ? "opacity-50"
                    : "opacity-70";
              return (
                <li
                  key={r.id}
                  className="anim-fade-up relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-ink/10 p-4 pl-5"
                  style={{ "--anim-delay": `${Math.min(i, 6) * 50}ms` } as React.CSSProperties}
                >
                  <span
                    aria-hidden
                    className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`}
                  />
                  <span className="display font-medium lowercase truncate">
                    {t("vs")} {rivalNombre}
                  </span>
                  <span
                    className={`text-[11px] mono uppercase tracking-[0.18em] shrink-0 ${resultClass}`}
                  >
                    {t(result)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
