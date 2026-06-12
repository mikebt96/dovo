import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import WishlistColumn from "@/app/_components/WishlistColumn";
import CopyCode from "@/app/_components/CopyCode";
import CardHalo from "@/app/_components/CardHalo";
import GameIcon, { type GameIconName } from "@/app/_components/GameIcon";
import { getRewardsData, getWishlist } from "@/lib/actions/rewards";

export const dynamic = "force-dynamic";

// Los iconos de rewards/partners viven en DB como emoji (seed F4) — en UI se
// renderizan como sprites (§4.9, F23·G14). Match semántico con el catálogo de
// GameIcon; todo lo demás cae al glifo de premio. Claves en escape unicode
// para que el grep de cierre de emojis quede en cero.
const ICONO_GLIFO: Record<string, GameIconName> = {
  "\u{1F3C6}": "corona", // trofeo
  "\u{1F957}": "plato", // ensalada
  "\u{1F381}": "premio", // regalo (default de core.rewards.icono)
  "\u{1F3F7}\u{FE0F}": "premio", // etiqueta (default de partner_discounts.icono)
};
const glifoDe = (emoji: string): GameIconName => ICONO_GLIFO[emoji] ?? "premio";

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
        <AppNav />
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
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-3xl lg:max-w-5xl mx-auto">
      <AppNav />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {/* Racha del dúo — gatillo emocional. Racha SIEMPRE en ámbar (léxico §2). */}
      <section className="card-game relative overflow-hidden p-7 sm:p-9 text-white mb-10">
        <CardHalo />
        <div className="relative flex items-end gap-4">
          <div
            className="display font-extrabold leading-[0.8] text-6xl sm:text-7xl tabular-nums"
            style={{
              // panel SIEMPRE oscuro → ámbar brillante fijo (el token reactivo
              // daría #8f5a00 sobre negro en tema claro — ilegible)
              color: "var(--game-racha)",
              textShadow: "0 0 44px color-mix(in srgb, var(--game-racha) 45%, transparent)",
            }}
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
                <div className="mb-2">
                  <GameIcon name={glifoDe(r.icono)} size={28} />
                </div>
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
                  <div className="mb-2 opacity-50 grayscale">
                    <GameIcon name={glifoDe(r.icono)} size={28} />
                  </div>
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
              <GameIcon name={glifoDe(p.icono)} size={24} className="shrink-0" />
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
