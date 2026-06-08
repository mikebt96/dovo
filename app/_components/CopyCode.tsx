"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Cupón de partner: muestra el código y lo copia al portapapeles (canje placeholder).
export default function CopyCode({ code }: { code: string }) {
  const t = useTranslations("recompensas");
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
    } catch {
      /* clipboard no disponible: el código sigue visible para copiar a mano */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mono text-xs tracking-wider rounded-md border border-signal/40 px-3 py-1.5 text-signal hover:bg-signal/10 transition-colors shrink-0"
    >
      {done ? t("copied") : code}
    </button>
  );
}
