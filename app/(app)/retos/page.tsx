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

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
      <AppNav active="retos" />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {activos.length > 0 && (
        <section className="space-y-4 mb-8">
          {activos.map(({ r, m }) => (
            <DuelScoreboard
              key={r.id}
              m={m}
              miTratoId={miTratoId}
              canRespond={r.creado_por !== user.id}
            />
          ))}
        </section>
      )}

      <Link
        href="/retos/nuevo"
        className="group block rounded-2xl border border-dashed border-signal/40 p-6 mb-10 transition-colors hover:border-signal hover:bg-signal/[0.04]"
      >
        <span className="text-[11px] mono uppercase tracking-[0.18em] text-signal">
          {t("active")}
        </span>
        <span className="mt-1 flex items-center gap-2 display font-semibold lowercase text-lg">
          {t("emptyCta")}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </Link>

      {historial.length > 0 && (
        <section>
          <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-50 mb-4">
            {t("history")}
          </h2>
          <ul className="space-y-2">
            {historial.map(({ r, m }) => {
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
                  className="relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-ink/10 p-4 pl-5"
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
