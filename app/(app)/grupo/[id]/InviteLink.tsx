"use client";

import { useState } from "react";

export default function InviteLink({ url }: { url: string }) {
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
      <div className="bg-papel-dark p-4 mono text-xs break-all">{url}</div>
      <button
        type="button"
        onClick={copy}
        className="bg-ink text-papel px-6 py-3 syne lowercase"
      >
        {copied ? "copiado ✓" : "copiar link"}
      </button>
    </div>
  );
}
