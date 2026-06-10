"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { reportClientError } from "@/lib/actions/admin";

// Error boundary editorial (client; corre bajo el provider del root layout).
// Reporta automático a la consola /admin (core.app_errors) — fire-and-forget.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error("[error-boundary]", error);
    reportClientError({
      mensaje: error.message || "error sin mensaje",
      stack: error.stack,
      url: typeof window !== "undefined" ? window.location.pathname : undefined,
    }).catch(() => {});
  }, [error]);

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink flex items-center">
      <div className="max-w-2xl mx-auto w-full">
        <p className="text-[11px] mono uppercase tracking-[0.22em] text-signal mb-4">
          error
        </p>
        <h1 className="display font-extrabold lowercase leading-[0.9] tracking-[-0.03em] text-[clamp(2.5rem,9vw,5rem)] text-balance">
          {t("errorTitle")}
        </h1>
        <p className="text-sm sm:text-base opacity-70 mt-5 max-w-md leading-relaxed">
          {t("errorBody")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-block mt-8 bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {t("errorRetry")}
        </button>
      </div>
    </main>
  );
}
