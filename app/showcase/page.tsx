import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageToggle from "@/app/_components/LanguageToggle";
import DemoLoginButton from "@/app/_components/DemoLoginButton";
import ShowcaseCharacterCard from "@/app/_components/ShowcaseCharacterCard";
import { getShowcase } from "@/lib/actions/leaderboard";

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const t = await getTranslations("showcase");
  const rows = await getShowcase(8);
  const podium = rows.slice(0, 3);
  const titleLines = t("heroTitle").split("\n");

  return (
    <main className="min-h-svh bg-papel text-ink">
      {/* Hero oscuro */}
      <section
        className="text-white px-6 pt-8 pb-20"
        style={{
          background:
            "radial-gradient(140% 120% at 50% -10%, var(--night-1) 0%, var(--night-2) 55%, #07060d 100%)",
        }}
      >
        <nav className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="syne text-2xl lowercase tracking-tight">
            dovo
          </Link>
          <div className="flex items-center gap-5 text-xs mono uppercase tracking-widest">
            <span className="text-white/80">
              <LanguageToggle />
            </span>
            <Link href="/sign-in" className="text-white/70 hover:text-white transition-colors">
              {t("navEnter")}
            </Link>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto mt-20">
          <p className="text-xs mono uppercase tracking-[0.2em] text-signal mb-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-signal motion-safe:animate-pulse" />
            {t("heroEyebrow")}
          </p>
          <h1 className="display font-extrabold tracking-tight leading-[0.95] text-5xl sm:text-7xl lowercase">
            {titleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="text-white/60 mt-6 max-w-lg text-lg">{t("heroSub")}</p>
          <div className="mt-8">
            <DemoLoginButton variant="pill" className="!border-white/25 !text-white hover:!border-signal hover:!text-signal" />
          </div>
        </div>
      </section>

      {/* Tarjetas destacadas (podio) */}
      {podium.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 -mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {podium.map((row) => (
              <ShowcaseCharacterCard key={row.posicion} row={row} />
            ))}
          </div>
        </section>
      )}

      {/* Tabla pública */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="display text-2xl font-bold lowercase">{t("boardTitle")}</h2>
        <p className="text-sm opacity-60 mt-1 mb-6">{t("boardSub")}</p>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.posicion}
              className="flex items-center gap-4 rounded-lg border border-ink/12 p-4"
            >
              <span className="display font-extrabold tabular-nums text-lg w-7 text-center opacity-50">
                {row.posicion}
              </span>
              <div className="flex-1 min-w-0">
                <span className="display font-semibold lowercase truncate block">
                  {row.nombre_grupo}
                </span>
                <span className="text-[11px] mono uppercase tracking-wider opacity-60">
                  {t("streak", { n: row.racha_duo })}
                  {row.top_clase ? ` · ${row.top_clase}` : ""}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="display font-extrabold tabular-nums text-lg leading-none">
                  {Math.round(row.puntos_por_miembro)}
                </div>
                <div className="text-[10px] mono uppercase tracking-wider opacity-50 mt-1">
                  {t("perMember")}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA final */}
      <section className="border-t border-ink/12 px-6 py-20 text-center">
        <h2 className="display text-4xl font-extrabold lowercase">{t("ctaTitle")}</h2>
        <p className="opacity-60 mt-2">{t("ctaSub")}</p>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <DemoLoginButton variant="pill" />
          <Link
            href="/sign-up"
            className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
          >
            {t("ctaSignup")}
          </Link>
        </div>
        <p className="text-[11px] mono uppercase tracking-widest opacity-40 mt-10">
          {t("foot")}
        </p>
      </section>
    </main>
  );
}
