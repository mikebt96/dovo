"use client";

import { useState, useTransition } from "react";
import { signInWithGoogle } from "@/lib/actions/auth";

export default function GoogleButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function go() {
    setError(null);
    start(async () => {
      const res = await signInWithGoogle();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.url;
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {pending ? "conectando…" : "continuar con google"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
