"use client";

import { useState, useTransition } from "react";
import { sendMagicLink } from "./actions";

export default function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await sendMagicLink(formData);
          if (!res.ok) setError(res.error);
          // si ok, el server action redirige; no hacemos nada aquí
        });
      }}
      className="space-y-6"
    >
      <input type="hidden" name="next" value={next} />

      <label className="block space-y-2">
        <span className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)]">
          Correo
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="tu@correo.com"
          className="input-bare input-mono"
        />
      </label>

      {error && (
        <p
          className="text-sm mono uppercase tracking-widest"
          style={{ color: "var(--color-danger)" }}
        >
          ✕ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-ink w-full justify-center"
      >
        {pending ? "Mandando…" : "Mándame el link →"}
      </button>
    </form>
  );
}
