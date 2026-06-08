import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageToggle from "./LanguageToggle";

type NavKey =
  | "home"
  | "leaderboard"
  | "retos"
  | "recompensas"
  | "perfil"
  | "ajustes";

// Nav unificada de la app autenticada (DESIGN.md §6 "Nav": fija, fina, glass).
// Sticky con backdrop-blur sobre el papel; el link activo va en signal. Reemplaza
// los headers ad-hoc que cada página reimplementaba (coherencia app-wide).
export default async function AppNav({ active }: { active?: NavKey }) {
  const t = await getTranslations("home");
  const links: { key: NavKey; href: string; label: string }[] = [
    { key: "leaderboard", href: "/leaderboard", label: t("navLeaderboard") },
    { key: "retos", href: "/retos", label: t("navRetos") },
    { key: "recompensas", href: "/recompensas", label: t("navRewards") },
    { key: "perfil", href: "/perfil", label: t("navProfile") },
    { key: "ajustes", href: "/ajustes", label: t("navSettings") },
  ];

  return (
    <header className="sticky top-0 z-40 -mx-6 mb-9 border-b border-ink/10 bg-papel/70 backdrop-blur-xl supports-[backdrop-filter]:bg-papel/55">
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <Link
          href="/"
          className="syne text-2xl lowercase tracking-tight hover:text-signal transition-colors"
        >
          dovo
        </Link>
        <nav className="flex items-center gap-x-3 sm:gap-x-5 text-[10px] sm:text-[11px] mono uppercase tracking-[0.12em] sm:tracking-[0.18em]">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              aria-current={active === l.key ? "page" : undefined}
              className={`-my-2 py-2 inline-flex items-center ${
                active === l.key
                  ? "text-signal"
                  : "opacity-50 hover:opacity-100 transition-opacity"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {/* Toggle de idioma sólo en desktop; en móvil vive en /ajustes (espacio). */}
          <span className="hidden sm:inline-flex">
            <LanguageToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}
