"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import GameIcon, { type GameIconName } from "./GameIcon";

// La nav ES el HUD (directiva §4.4): tab bar fija de 64px, SIEMPRE nocturna
// (incluso sobre páginas claras), 5 tabs + recursos del juego siempre a la
// vista — munición (¿entrenaste hoy?) y escudo. z-70: encima del Grain (z-60).
// Client island con usePathname (la home vive FUERA del route group (app), así
// que el HUD se monta en dos puntos y el tab activo se deriva de la ruta).
// El spacer in-flow evita que el contenido muera detrás de la barra sin tocar
// el <main> de cada página.

const TABS: { key: string; href: string; icon: GameIconName }[] = [
  { key: "hoy", href: "/", icon: "nivel" },
  { key: "duelo", href: "/retos", icon: "duelo" },
  { key: "tabla", href: "/leaderboard", icon: "tabla" },
  { key: "premios", href: "/recompensas", icon: "premio" },
  { key: "perfil", href: "/perfil", icon: "perfil" },
];

function activeKey(path: string): string {
  if (path === "/") return "hoy";
  if (path.startsWith("/retos")) return "duelo";
  if (path.startsWith("/leaderboard")) return "tabla";
  if (path.startsWith("/recompensas")) return "premios";
  if (path.startsWith("/perfil") || path.startsWith("/ajustes")) return "perfil";
  return "hoy";
}

export default function BottomHUD({
  ammo,
  shield,
}: {
  ammo: boolean;
  shield: boolean;
}) {
  const t = useTranslations("hud");
  const active = activeKey(usePathname());

  return (
    <>
      {/* spacer: reserva el alto de la barra en el flujo del documento */}
      <div aria-hidden className="h-24" />
      <nav
        aria-label={t("navLabel")}
        className="fixed bottom-0 inset-x-0 z-[70] border-t border-white/10 backdrop-blur-[12px]"
        style={{
          background: "rgba(7, 6, 13, 0.85)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* recursos del juego: chip de munición + escudo, esquina del HUD */}
        <div
          aria-hidden={!ammo && !shield}
          className="pointer-events-none absolute -top-3.5 right-4 flex items-center gap-2"
        >
          {shield && (
            <span
              title={t("shield")}
              className="pointer-events-auto inline-flex items-center justify-center w-7 h-7 rounded-[10px]"
              style={{
                background: "#0b0a14",
                color: "var(--mode-coop)",
                border: "1px solid color-mix(in srgb, var(--mode-coop) 50%, transparent)",
                boxShadow: "0 0 10px color-mix(in srgb, var(--mode-coop) 35%, transparent)",
              }}
            >
              <GameIcon name="escudo" size={15} filled />
            </span>
          )}
          <span
            title={ammo ? t("ammoOn") : t("ammoOff")}
            className="pointer-events-auto inline-flex items-center justify-center w-7 h-7 rounded-[10px]"
            style={{
              background: "#0b0a14",
              color: "var(--stat-vit)",
              border: "1px solid color-mix(in srgb, var(--stat-vit) 45%, transparent)",
              ...(ammo
                ? { boxShadow: "0 0 10px color-mix(in srgb, var(--stat-vit) 40%, transparent)" }
                : { filter: "grayscale(1)", opacity: 0.45 }),
            }}
          >
            <GameIcon name="municion" size={15} filled={ammo} />
          </span>
        </div>

        <ul className="flex items-stretch justify-around h-16 max-w-2xl mx-auto">
          {TABS.map((tab) => {
            const is = active === tab.key;
            return (
              <li key={tab.key} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={is ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-1 ${
                    is ? "text-white" : "text-white/50"
                  }`}
                >
                  <span className="relative">
                    <GameIcon name={tab.icon} size={22} filled={is} />
                    {is && (
                      <span
                        aria-hidden
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-signal"
                      />
                    )}
                  </span>
                  <span className="text-[9px] mono uppercase tracking-[0.12em]">
                    {t(tab.key)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
