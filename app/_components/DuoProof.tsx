import { getTranslations } from "next-intl/server";

/* DuoProof — the "why dovo" evidence block for the authed app.
   Reused at the two decision points where a user is alone and could bring
   someone in: the empty home and the create/join-group onboarding.

   Design: an editorial "results table" — 43% (ghost) vs 6% (signal). The
   visual jump from one number to the other carries the argument before a
   word is read. The citation sits in mono, like a paper's apparatus, so the
   claim is attributed, not asserted. */
export default async function DuoProof() {
  const t = await getTranslations("duoProof");

  return (
    <section
      className="border border-ink/15 rounded-xl overflow-hidden"
      aria-label={t("eyebrow")}
    >
      <p className="mono text-[10px] uppercase tracking-[0.22em] text-signal px-6 pt-6 pb-5">
        {t("eyebrow")}
      </p>

      <div className="grid grid-cols-2 border-t border-ink/12">
        <div className="px-6 py-7 border-b border-ink/12">
          <p className="display font-extrabold tabular-nums leading-[0.82] text-[clamp(48px,16vw,84px)] text-ink/25">
            43%
          </p>
          <p className="mono text-[10px] uppercase tracking-widest opacity-55 mt-3 max-w-[18ch]">
            {t("labelSolo")}
          </p>
        </div>
        <div className="px-6 py-7 border-b border-l border-ink/12">
          <p className="display font-extrabold tabular-nums leading-[0.82] text-[clamp(48px,16vw,84px)] text-signal">
            6%
          </p>
          <p className="mono text-[10px] uppercase tracking-widest opacity-55 mt-3 max-w-[18ch]">
            {t("labelDuo")}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed opacity-80 px-6 pt-5">{t("body")}</p>
      <p className="mono text-[10px] leading-relaxed opacity-40 px-6 pt-3 pb-6">
        {t("source")}
      </p>
    </section>
  );
}
