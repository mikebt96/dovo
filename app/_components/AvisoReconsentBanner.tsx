"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { aceptarAvisoPrivacidad } from "@/lib/actions/salud";

// Re-consentimiento del aviso v1.0 (aviso §19): cambio material (nueva
// finalidad de monetización) ⇒ los usuarios anteriores reaceptan. Banner
// no-bloqueante pero persistente: vive hasta que aceptan. No se puede
// descartar sin aceptar — es el registro legal de la versión aceptada.
export default function AvisoReconsentBanner() {
  const t = useTranslations("aviso");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function aceptar() {
    setError(null);
    start(async () => {
      const r = await aceptarAvisoPrivacidad();
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-signal/40 bg-signal/5 p-4">
      <p className="text-[10px] mono uppercase tracking-[0.18em] text-signal">
        {t("eyebrow")}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed">{t("body")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={aceptar}
          disabled={pending}
          className="bg-ink text-papel px-5 py-2.5 rounded-full display font-semibold lowercase text-sm hover:bg-signal hover:text-white transition-colors disabled:opacity-50"
        >
          {pending ? t("aceptando") : t("aceptar")}
        </button>
        <Link
          href="/privacidad"
          className="text-[11px] mono uppercase tracking-[0.14em] underline decoration-signal/40 underline-offset-4 opacity-70 hover:opacity-100"
        >
          {t("leer")}
        </Link>
      </div>
      {error && <p className="mt-2 text-xs text-rival-deep">{error}</p>}
    </section>
  );
}
