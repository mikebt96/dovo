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
      // navigator.clipboard puede fallar en contextos no-secure; fallback manual
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-papel-dark px-4 py-3 font-mono text-xs break-all">
        {url}
      </div>
      <button
        type="button"
        onClick={copy}
        className="px-6 py-3 bg-ink text-papel syne lowercase"
      >
        {copied ? "copiado ✓" : "copiar link"}
      </button>
    </div>
  );
}
