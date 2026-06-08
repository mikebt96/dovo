import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import LanguageToggle from "@/app/_components/LanguageToggle";
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
  const tHome = await getTranslations("home");
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

  const header = (
    <header className="flex justify-between items-start mb-8">
      <Link href="/" className="syne text-2xl lowercase tracking-tight">
        dovo
      </Link>
      <nav className="flex items-center gap-4 text-xs uppercase tracking-widest opacity-60">
        <Link href="/leaderboard" className="hover:opacity-100">
          {tHome("navLeaderboard")}
        </Link>
        <Link href="/perfil" className="hover:opacity-100">
          {tHome("navProfile")}
        </Link>
        <LanguageToggle />
      </nav>
    </header>
  );

  if (!miembro) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
        {header}
        <h1 className="display text-3xl font-extrabold lowercase mb-2">
          {t("title")}
        </h1>
        <p className="text-sm opacity-60 mb-6">{t("emptyBody")}</p>
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
      {header}

      <section className="mb-8">
        <p className="text-xs mono uppercase tracking-widest text-signal mb-2">
          {t("eyebrow")}
        </p>
        <h1 className="display text-3xl font-extrabold lowercase">{t("title")}</h1>
        <p className="text-sm opacity-60 mt-2 max-w-md">{t("subtitle")}</p>
      </section>

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
        className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors mb-10"
      >
        {t("emptyCta")}
      </Link>

      {historial.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest opacity-60 mb-3">
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
              const resultClass =
                result === "won"
                  ? "text-signal"
                  : result === "lost"
                    ? "opacity-50"
                    : "opacity-70";
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between border border-ink/12 rounded-lg p-4"
                >
                  <span className="display font-medium lowercase truncate">
                    {t("vs")} {rivalNombre}
                  </span>
                  <span
                    className={`text-xs mono uppercase tracking-widest ${resultClass}`}
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
