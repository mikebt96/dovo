"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { saveNutritionProfile } from "@/lib/actions/nutrition";
import { RESTRICCIONES } from "@/lib/nutrition/types";

// Onboarding nutricional (1 pantalla, editorial): restricciones como chips, presupuesto,
// comidas/día y preferencias libres. Al guardar se genera el plan base de la semana.
export default function NutritionProfileForm({
  initial,
}: {
  initial?: {
    restricciones: string[];
    presupuesto: string;
    comidas_por_dia: number;
    preferencias: string | null;
    menus_distintos?: number;
  };
}) {
  const t = useTranslations("nutricion");
  const [restricciones, setRestricciones] = useState<string[]>(initial?.restricciones ?? []);
  const [presupuesto, setPresupuesto] = useState(initial?.presupuesto ?? "medio");
  const [comidas, setComidas] = useState(initial?.comidas_por_dia ?? 4);
  const [menus, setMenus] = useState(initial?.menus_distintos ?? 5);
  const [preferencias, setPreferencias] = useState(initial?.preferencias ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleRestriccion(r: string) {
    setRestricciones((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await saveNutritionProfile({
        restricciones,
        presupuesto,
        comidas_por_dia: comidas,
        preferencias: preferencias || undefined,
        menus_distintos: menus,
      });
      if (!res.ok) setErr(res.error);
    });
  }

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs mono uppercase tracking-[0.12em] border transition-colors ${
      active
        ? "border-signal bg-signal/10 text-signal"
        : "border-ink/15 opacity-60 hover:opacity-100"
    }`;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset>
        <legend className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-3">
          {t("formRestricciones")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {RESTRICCIONES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRestriccion(r)}
              aria-pressed={restricciones.includes(r)}
              className={chip(restricciones.includes(r))}
            >
              {t(`restriccion.${r}`)}
            </button>
          ))}
        </div>
        <p className="text-xs opacity-50 mt-2">{t("formRestriccionesHint")}</p>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-3">
          {t("formPresupuesto")}
        </legend>
        <div className="flex gap-2">
          {(["bajo", "medio", "alto"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPresupuesto(p)}
              aria-pressed={presupuesto === p}
              className={chip(presupuesto === p)}
            >
              {t(`presupuesto.${p}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-3">
          {t("formComidas")}
        </legend>
        <div className="flex gap-2">
          {[3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setComidas(n)}
              aria-pressed={comidas === n}
              className={chip(comidas === n)}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-3">
          {t("formMenus")}
        </legend>
        <div className="flex gap-2">
          {[3, 5, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMenus(n)}
              aria-pressed={menus === n}
              className={chip(menus === n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs opacity-50 mt-2">{t("formMenusHint")}</p>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-3">
          {t("formPreferencias")}
        </legend>
        <textarea
          value={preferencias}
          onChange={(e) => setPreferencias(e.target.value)}
          placeholder={t("formPreferenciasPlaceholder")}
          maxLength={300}
          rows={3}
          className="w-full rounded-xl border border-ink/15 bg-transparent p-4 text-sm focus:border-signal focus:outline-none resize-none"
        />
      </fieldset>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors disabled:opacity-60"
        >
          {pending ? t("formSaving") : t("formSubmit")}
        </button>
        {err && (
          <span className="text-xs mono uppercase tracking-wider text-rival-deep">{err}</span>
        )}
      </div>
    </form>
  );
}
