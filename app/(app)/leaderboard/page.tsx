import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageToggle from "@/app/_components/LanguageToggle";
import DuoProof from "@/app/_components/DuoProof";
import DuoLeaderRow from "@/app/_components/DuoLeaderRow";
import {
  getLeaderboard,
  misTratoIds,
  type LeaderRow,
} from "@/lib/actions/leaderboard";
import type { Periodo } from "@/lib/utils/periodo";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  const periodo: Periodo = sp.p === "mes" ? "mes" : "semana";
  const t = await getTranslations("leaderboard");
  const tHome = await getTranslations("home");

  const [res, mine] = await Promise.all([getLeaderboard(periodo), misTratoIds()]);
  const rows: LeaderRow[] = res.ok ? res.data : [];
  const mineSet = new Set(mine);

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs mono uppercase tracking-widest transition-colors ${
      active ? "bg-ink text-papel" : "opacity-50 hover:opacity-100"
    }`;

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
      <header className="flex justify-between items-start mb-8">
        <Link href="/" className="syne text-2xl lowercase tracking-tight">
          dovo
        </Link>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-widest opacity-60">
          <Link href="/retos" className="hover:opacity-100">
            {tHome("navRetos")}
          </Link>
          <Link href="/perfil" className="hover:opacity-100">
            {tHome("navProfile")}
          </Link>
          <LanguageToggle />
        </nav>
      </header>

      <section className="mb-8">
        <p className="text-xs mono uppercase tracking-widest text-signal mb-2">
          {t("eyebrow")}
        </p>
        <h1 className="display text-3xl font-extrabold lowercase">{t("title")}</h1>
        <p className="text-sm opacity-60 mt-2 max-w-md">{t("subtitle")}</p>
      </section>

      <div className="flex gap-2 mb-6">
        <Link href="/leaderboard?p=semana" className={tabClass(periodo === "semana")}>
          {t("tabWeek")}
        </Link>
        <Link href="/leaderboard?p=mes" className={tabClass(periodo === "mes")}>
          {t("tabMonth")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="space-y-6">
          <DuoProof />
          <div>
            <h2 className="display text-xl font-bold lowercase mb-2">
              {t("emptyTitle")}
            </h2>
            <p className="text-sm opacity-60 mb-4">{t("emptyBody")}</p>
            <Link
              href="/onboarding/grupo"
              className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
            >
              {t("emptyCta")}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <DuoLeaderRow
              key={row.trato_id}
              row={row}
              isYou={mineSet.has(row.trato_id)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
