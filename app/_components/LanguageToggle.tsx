"use client";

import { Fragment, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/actions/locale";
import { locales } from "@/lib/i18n/config";

// Cookie-based language switcher: writes the cookie via a server action, then
// refreshes so getRequestConfig re-reads it. Used in the landing nav and the app.
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (loc: string) => {
    if (loc === active || pending) return;
    startTransition(async () => {
      await setLocale(loc);
      router.refresh();
    });
  };

  return (
    <div className={`lang-toggle ${className}`.trim()} role="group" aria-label="Language">
      {locales.map((loc, i) => (
        <Fragment key={loc}>
          {i > 0 && (
            <span className="lang-sep" aria-hidden>
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => choose(loc)}
            aria-pressed={loc === active}
            data-active={loc === active}
            disabled={pending}
          >
            {loc.toUpperCase()}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
