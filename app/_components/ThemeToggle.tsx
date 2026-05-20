"use client";

import { Fragment, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setTheme } from "@/lib/actions/theme";

const OPTIONS = ["system", "light", "dark"] as const;
type Opt = (typeof OPTIONS)[number];

// Appearance switcher: Auto (OS) · Light · Dark. Writes a cookie via a server
// action, then refreshes so the layout re-reads data-theme.
export default function ThemeToggle({ current }: { current: Opt }) {
  const t = useTranslations("ajustes");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const label: Record<Opt, string> = {
    system: t("themeAuto"),
    light: t("themeLight"),
    dark: t("themeDark"),
  };

  const choose = (opt: Opt) => {
    if (opt === current || pending) return;
    startTransition(async () => {
      await setTheme(opt);
      router.refresh();
    });
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {OPTIONS.map((opt, i) => (
        <Fragment key={opt}>
          {i > 0 && (
            <span className="lang-sep" aria-hidden>
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => choose(opt)}
            data-active={opt === current}
            aria-pressed={opt === current}
            disabled={pending}
          >
            {label[opt]}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
