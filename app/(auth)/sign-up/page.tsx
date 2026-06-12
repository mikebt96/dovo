"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { signUpAction } from "@/lib/actions/auth";
import GoogleButton from "../_components/GoogleButton";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="display text-2xl font-extrabold mb-3 lowercase">{t("checkEmail")}</h1>
        <p className="text-sm opacity-70">{t("signUp.sentBody")}</p>
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
        <h1 className="display text-3xl font-extrabold lowercase mb-2">{t("signUp.title")}</h1>
        <p className="text-sm opacity-70">{t("signUp.subtitle")}</p>
      </div>

      <GoogleButton />

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest opacity-40">
        <span className="flex-1 h-px bg-ink/20" />
        {t("emailDivider")}
        <span className="flex-1 h-px bg-ink/20" />
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60">{t("nameLabel")}</span>
        <input
          name="nombre"
          required
          autoComplete="name"
          className="block w-full mt-1 border-b border-ink pb-2 bg-transparent focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60">{t("emailLabel")}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="block w-full mt-1 border-b border-ink pb-2 bg-transparent focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-rival-deep">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-papel py-3 rounded-full display font-semibold lowercase disabled:opacity-50 hover:bg-signal hover:text-white transition-colors"
      >
        {pending ? t("sending") : t("signUp.submit")}
      </button>

      <p className="text-xs opacity-60 text-center leading-relaxed">
        {t.rich("signUp.legal", {
          terms: (chunks) => (
            <a href="/terminos" className="underline">
              {chunks}
            </a>
          ),
          privacy: (chunks) => (
            <a href="/privacidad" className="underline">
              {chunks}
            </a>
          ),
        })}
      </p>

      <p className="text-xs opacity-60 text-center">
        {t.rich("signUp.footer", {
          a: (chunks) => (
            <a href="/sign-in" className="underline">
              {chunks}
            </a>
          ),
        })}
      </p>
    </form>
  );
}
