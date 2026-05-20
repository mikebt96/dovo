"use client";

import { useState, useTransition } from "react";
import { signUpAction } from "@/lib/actions/auth";
import GoogleButton from "../_components/GoogleButton";

export default function SignUpPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="syne text-2xl mb-3 lowercase">revisa tu correo</h1>
        <p className="text-sm opacity-70">
          te mandamos un link para entrar a dovo.
        </p>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await signUpAction(formData);
          if (result.ok) setSent(true);
          else setError(result.error);
        });
      }}
      className="space-y-6"
    >
      <div>
        <h1 className="syne text-3xl lowercase mb-2">hacer dúo</h1>
        <p className="text-sm opacity-70">empieza con google o tu correo.</p>
      </div>

      <GoogleButton />

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest opacity-40">
        <span className="flex-1 h-px bg-ink/20" />
        o con correo
        <span className="flex-1 h-px bg-ink/20" />
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60">nombre</span>
        <input
          name="nombre"
          required
          autoComplete="name"
          className="block w-full mt-1 border-b border-ink pb-2 bg-transparent focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60">email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="block w-full mt-1 border-b border-ink pb-2 bg-transparent focus:outline-none"
        />
      </label>

      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "mandando..." : "entrar"}
      </button>

      <p className="text-xs opacity-60 text-center leading-relaxed">
        al continuar aceptas los{" "}
        <a href="/terminos" className="underline">términos</a>{" "}
        y el{" "}
        <a href="/privacidad" className="underline">aviso de privacidad</a>.
      </p>

      <p className="text-xs opacity-60 text-center">
        ¿ya tienes cuenta? <a href="/sign-in" className="underline">entra aquí</a>.
      </p>
    </form>
  );
}
