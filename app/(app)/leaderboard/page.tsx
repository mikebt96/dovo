import Link from "next/link";
import { getTranslations } from "next-intl/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import DuoProof from "@/app/_components/DuoProof";
import DuoLeaderRow from "@/app/_components/DuoLeaderRow";
import DuoChampion from "@/app/_components/DuoChampion";
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

  const [res, mine] = await Promise.all([getLeaderboard(periodo), misTratoIds()]);
  const rows: LeaderRow[] = res.ok ? res.data : [];
  const mineSet = new Set(mine);
  const [champion, ...rest] = rows;

  const tabClass = (active: boolean) =>
    `flex-1 sm:flex-none sm:px-6 py-2 rounded-full text-[11px] mono uppercase tracking-[0.18em] text-center transition-colors ${
      active ? "bg-ink text-papel" : "text-ink/50 hover:text-ink"
    }`;

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-4xl mx-auto">
      <AppNav active="leaderboard" />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="flex gap-1 mb-8 p-1 rounded-full bg-papel-dark/60 w-full sm:w-fit">
        <Link href="/leaderboard?p=semana" className={tabClass(periodo === "semana")}>
          {t("tabWeek")}
        </Link>
        <Link href="/leaderboard?p=mes" className={tabClass(periodo === "mes")}>
          {t("tabMonth")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="space-y-8">
          <DuoProof />
          <div>
            <h2 className="display text-2xl font-bold lowercase mb-2">
              {t("emptyTitle")}
            </h2>
            <p className="text-sm opacity-60 mb-5 max-w-sm">{t("emptyBody")}</p>
            <Link
              href="/onboarding/grupo"
              className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
            >
              {t("emptyCta")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {champion && (
            <div className="anim-fade-up">
              <DuoChampion row={champion} isYou={mineSet.has(champion.trato_id)} />
            </div>
          )}
          {/* Stagger de juego (F12): la tabla entra en cascada vía nth-child (DuoLeaderRow ya es <li>). */}
          {rest.length > 0 && (
            <ul className="space-y-2 pt-3 anim-stagger">
              {rest.map((row) => (
                <DuoLeaderRow
                  key={row.trato_id}
                  row={row}
                  isYou={mineSet.has(row.trato_id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
