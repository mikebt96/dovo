"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/actions/profile";

export default function SignOutButton() {
  const t = useTranslations("ajustes");
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => start(() => signOut())}
      disabled={pending}
      className="w-full border border-ink py-3 display font-semibold lowercase disabled:opacity-50 hover:bg-ink hover:text-papel transition-colors"
    >
      {pending ? t("signingOut") : t("signOut")}
    </button>
  );
}
