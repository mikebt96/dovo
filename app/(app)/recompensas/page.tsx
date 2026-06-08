import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import WishlistColumn from "@/app/_components/WishlistColumn";
import CopyCode from "@/app/_components/CopyCode";
import { getRewardsData, getWishlist } from "@/lib/actions/rewards";

export const dynamic = "force-dynamic";

export default async function RecompensasPage() {
  const t = await getTranslations("recompensas");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const data = await getRewardsData();

  if (!data.tratoId) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
        <AppNav active="recompensas" />
        <PageHero
          eyebrow={t("eyebrow")}
          title={t("noGroupTitle")}
          subtitle={t("noGroupBody")}
        />
        <Link
          href="/onboarding/grupo"
          className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {t("noGroupCta")}
        </Link>
      </main>
    );
  }

  const wishlist = await getWishlist(data.tratoId);
  const desbloqueadas = data.rewards.filter((r) => r.unlocked);
  const proximas = data.rewards.filter((r) => !r.unlocked);

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-3xl mx-auto">
      <AppNav active="recompensas" />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {/* Racha del dúo — gatillo emocional, panel oscuro premium (DESIGN.md §6) */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 sm:p-9 text-white mb-10"
        style={{
          background:
            "radial-gradient(130% 150% at 12% 0%, #16132a 0%, #0b0a14 55%, #07060d 100%)",
          boxShadow: "0 24px 60px -28px rgba(109,74,255,0.55)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(109,74,255,0.5), transparent 70%)",
          }}
        />
        <div className="relative flex items-end gap-4">
          <div
            className="display font-extrabold leading-[0.8] text-6xl sm:text-7xl tabular-nums"
            style={{ textShadow: "0 0 44px rgba(109,74,255,0.45)" }}
          >
            {data.racha}
          </div>
          <div className="pb-2 max-w-[11rem] text-[11px] mono uppercase tracking-[0.22em] text-white/60 leading-relaxed">
            {t("rachaUnit")}
          </div>
        </div>
      </section>

      {desbloqueadas.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
            {t("unlocked")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {desbloqueadas.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-signal/40 bg-signal/[0.05] p-4"
              >
                <div className="text-3xl mb-2">{r.icono}</div>
                <div className="display font-semibold lowercase">{r.titulo}</div>
                <div className="text-xs opacity-60 mt-1 leading-relaxed">
                  {r.descripcion}
                </div>
                <div className="text-[10px] mono uppercase tracking-widest text-signal mt-3">
                  ✓ {t("unlocked")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {proximas.length > 0 && (
        <section className="mb-12">
          <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
            {t("upcoming")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {proximas.map((r) => {
              const pct =
                r.racha_threshold > 0
                  ? Math.min(100, Math.round((data.racha / r.racha_threshold) * 100))
                  : 0;
              return (
                <div key={r.id} className="rounded-xl border border-ink/10 p-4">
                  <div className="text-3xl mb-2 opacity-50 grayscale">{r.icono}</div>
                  <div className="display font-semibold lowercase">{r.titulo}</div>
                  <div className="text-xs opacity-60 mt-1 leading-relaxed">
                    {r.descripcion}
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-papel-dark overflow-hidden">
                    <div
                      className="h-full bg-signal rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] mono uppercase tracking-widest opacity-60 mt-2">
                    {t("lockedHint", { n: r.faltan })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-1">
          {t("wishlistTitle")}
        </h2>
        <p className="text-sm opacity-60 mb-5">{t("wishlistSub")}</p>
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 rounded-2xl border border-ink/10 p-5">
          {wishlist.map((g) => (
            <WishlistColumn
              key={g.userId}
              nombre={g.nombre}
              isMe={g.isMe}
              items={g.items}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-1">
          {t("partnersTitle")}
        </h2>
        <p className="text-sm opacity-60 mb-5">{t("partnersSub")}</p>
        <ul className="space-y-2">
          {data.partners.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-ink/10 p-4"
            >
              <span className="text-2xl shrink-0">{p.icono}</span>
              <div className="flex-1 min-w-0">
                <div className="display font-semibold lowercase truncate">
                  {p.titulo}
                </div>
                <div className="text-[11px] mono uppercase tracking-wider opacity-50">
                  {p.partner}
                </div>
              </div>
              {p.unlocked ? (
                <CopyCode code={p.codigo} />
              ) : (
                <span className="text-[10px] mono uppercase tracking-widest opacity-50 shrink-0 text-right">
                  {t("lockedHint", { n: p.faltan })}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
