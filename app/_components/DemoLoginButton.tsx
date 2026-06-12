"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { loginDemo } from "@/lib/actions/demo";

// Entra a la cuenta demo (email+password, sin OAuth). loginDemo redirige al
// leaderboard en éxito; solo vuelve en error.
export default function DemoLoginButton({
  variant = "pill",
  className = "",
}: {
  variant?: "pill" | "ghost";
  className?: string;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const base =
    variant === "pill"
      ? "inline-flex items-center justify-center gap-2 rounded-full border border-ink/25 px-6 py-3 display font-semibold lowercase hover:border-signal hover:text-signal transition-colors disabled:opacity-50"
      : "inline-flex items-center gap-1 text-xs mono uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity disabled:opacity-40";

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={`${base} ${className}`}
        onClick={() => {
          setErr(null);
          start(async () => {
            const r = await loginDemo();
            if (r && !r.ok) setErr(r.error);
          });
        }}
      >
        {pending ? t("demoLoading") : t("demoButton")}
      </button>
      {err && <span className="text-xs text-rival-deep">{err}</span>}
    </span>
  );
}
