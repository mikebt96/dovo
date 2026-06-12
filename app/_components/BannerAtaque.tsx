"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import GameIcon from "./GameIcon";

// Banner de impacto (directiva §5 home-1): te metieron un golpe y la home lo
// dice — UNA vez (visto en localStorage por ataque), con shake de entrada y
// CTA a cobrársela. Nada rival está a 90°: borde izquierdo de peligro.
export default function BannerAtaque({
  ataqueId,
  tipo,
}: {
  ataqueId: string;
  tipo: "golpe" | "congelamiento";
}) {
  const t = useTranslations("home");
  const [visible, setVisible] = useState(false);
  const key = `dovo_atk_visto_${ataqueId}`;

  useEffect(() => {
    if (!localStorage.getItem(key)) setVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  function cerrar() {
    localStorage.setItem(key, "1");
    setVisible(false);
  }

  return (
    <div
      className="anim-shake mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: "color-mix(in srgb, var(--mode-rival) 10%, transparent)",
        borderLeft: "3px solid var(--mode-rival)",
      }}
    >
      <span style={{ color: "var(--mode-rival-deep)" }} className="shrink-0">
        <GameIcon name={tipo === "golpe" ? "golpe" : "hielo"} size={18} filled={tipo === "golpe"} />
      </span>
      <p className="flex-1 min-w-0 text-sm" style={{ color: "var(--mode-rival-deep)" }}>
        {tipo === "golpe" ? t("atkBannerGolpe") : t("atkBannerFreeze")}
      </p>
      <Link
        href="/retos"
        className="shrink-0 text-[10px] mono uppercase tracking-[0.14em] underline underline-offset-4"
        style={{ color: "var(--mode-rival-deep)" }}
      >
        {t("atkBannerCta")}
      </Link>
      <button
        type="button"
        onClick={cerrar}
        aria-label={t("atkBannerDismiss")}
        className="shrink-0 w-6 h-6 inline-flex items-center justify-center text-sm opacity-50 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
