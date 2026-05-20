import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import LanguageToggle from "@/app/_components/LanguageToggle";

// Legal bodies stay in Spanish (authoritative, MX jurisdiction). Only the
// chrome localizes; in EN we surface a notice that Spanish prevails.
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("legal");

  return (
    <main className="min-h-svh max-w-3xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between border-b border-ink pb-6">
        <Link href="/" className="syne text-3xl lowercase tracking-tight">
          dovo
        </Link>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-widest opacity-60">
          <Link href="/privacidad" className="hover:opacity-100">
            {t("navPrivacy")}
          </Link>
          <Link href="/terminos" className="hover:opacity-100">
            {t("navTerms")}
          </Link>
          <LanguageToggle />
        </nav>
      </header>
      {locale === "en" && (
        <aside className="border-l-2 border-signal pl-4 py-2 mb-10 text-sm opacity-80">
          {t("spanishNotice")}
        </aside>
      )}
      {children}
    </main>
  );
}
