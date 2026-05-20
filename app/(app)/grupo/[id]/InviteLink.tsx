"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function InviteLink({ url }: { url: string }) {
  const t = useTranslations("grupo");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard puede fallar en contextos no-https; fallback silencioso
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-papel-dark rounded-lg p-4 mono text-xs break-all">{url}</div>
      <button
        type="button"
        onClick={copy}
        className="bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
      >
        {copied ? t("copied") : t("copyLink")}
      </button>
    </div>
  );
}
