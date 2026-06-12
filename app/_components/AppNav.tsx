import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageToggle from "./LanguageToggle";


// Top bar adelgazada (directiva §4.4): la navegación vive en el BottomHUD; aquí
// solo el mark + ajustes + idioma. backdrop-blur-sm, no xl — presupuesto de blur
// §3: máx dos backdrop-filter fijos y el HUD ya usa el grande.
// active solo distingue /ajustes (oculta su propio link) — F23·G8
export default async function AppNav({ active }: { active?: "ajustes" }) {
  const t = await getTranslations("home");
  return (
    <header className="sticky top-0 z-40 -mx-6 mb-9 border-b border-ink/10 bg-papel/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-6 py-2.5">
        <Link
          href="/"
          className="syne text-xl lowercase tracking-tight hover:text-signal transition-colors"
        >
          dovo
        </Link>
        <nav className="flex items-center gap-x-4 text-[10px] mono uppercase tracking-[0.14em]">
          {active !== "ajustes" && (
            <Link
              href="/ajustes"
              className="opacity-50 hover:opacity-100 transition-opacity -my-2 py-2"
            >
              {t("navSettings")}
            </Link>
          )}
          <span className="hidden sm:inline-flex">
            <LanguageToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}
