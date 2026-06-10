import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Grain from "@/app/_components/Grain";

// 404 editorial (DESIGN.md §8: big type is the layout).
export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink flex items-center">
      <div className="max-w-2xl mx-auto w-full">
        <p className="text-[11px] mono uppercase tracking-[0.22em] text-signal mb-4">404</p>
        <h1 className="display font-extrabold lowercase leading-[0.9] tracking-[-0.03em] text-[clamp(3rem,10vw,6rem)] text-balance">
          {t("notFoundTitle")}
        </h1>
        <p className="text-sm sm:text-base opacity-70 mt-5 max-w-md leading-relaxed">
          {t("notFoundBody")}
        </p>
        <Link
          href="/"
          className="inline-block mt-8 bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {t("notFoundCta")}
        </Link>
      </div>
      <Grain />
    </main>
  );
}
