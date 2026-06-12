"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { limpiarMolestiasHoy, toggleMolestia } from "@/lib/actions/molestias";
import { ZONAS, type Zona, type TipRecuperacion } from "@/lib/workout/recuperacion";

// Pre-entreno (spec del founder): antes de entrenar, "¿cómo llegas hoy?".
// Zona con molestia → los ejercicios que la cargan se marcan "cuídate hoy" en
// el plan (server). Jamás regaño, jamás bloqueo: el jugador manda en su cuerpo.
// Abajo, la recuperación del día — SIEMPRE con alternativa para quien no le
// gusta (mock determinista; la IA personalizará con key).
export default function PreEntreno({
  zonasIniciales,
  tip,
}: {
  zonasIniciales: Zona[];
  tip: TipRecuperacion;
}) {
  const t = useTranslations("rutina");
  const router = useRouter();
  const [zonas, setZonas] = useState<Zona[]>(zonasIniciales);
  const [pending, start] = useTransition();

  function toggle(z: Zona) {
    const activa = zonas.includes(z);
    setZonas((prev) => (activa ? prev.filter((x) => x !== z) : [...prev, z])); // optimista
    start(async () => {
      const r = await toggleMolestia(z);
      if (!r.ok) setZonas(zonasIniciales);
      else router.refresh(); // el plan re-marca "cuídate hoy" server-side
    });
  }

  function bien() {
    if (zonas.length === 0) return;
    setZonas([]);
    start(async () => {
      const r = await limpiarMolestiasHoy();
      if (!r.ok) setZonas(zonasIniciales);
      else router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-ink/10 p-4 sm:p-5 mb-6">
      <p className="text-[11px] mono uppercase tracking-[0.22em] opacity-50">
        {t("preEyebrow")}
      </p>
      <p className="display font-bold lowercase text-lg mt-1">{t("preQuestion")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={bien}
          aria-pressed={zonas.length === 0}
          className="rounded-full px-3.5 py-1.5 text-[11px] mono uppercase tracking-[0.12em] border transition-colors disabled:opacity-50"
          style={
            zonas.length === 0
              ? {
                  color: "var(--mode-coop-deep)",
                  borderColor: "color-mix(in srgb, var(--mode-coop) 55%, transparent)",
                  background: "color-mix(in srgb, var(--mode-coop) 12%, transparent)",
                }
              : { borderColor: "color-mix(in srgb, var(--c-ink) 15%, transparent)", opacity: 0.6 }
          }
        >
          {t("preBien")}
        </button>
        {ZONAS.map((z) => {
          const activa = zonas.includes(z);
          return (
            <button
              key={z}
              type="button"
              disabled={pending}
              onClick={() => toggle(z)}
              aria-pressed={activa}
              className="rounded-full px-3.5 py-1.5 text-[11px] mono uppercase tracking-[0.12em] border transition-colors disabled:opacity-50"
              style={
                activa
                  ? {
                      color: "var(--mode-rival-deep)",
                      borderColor: "color-mix(in srgb, var(--mode-rival) 50%, transparent)",
                      background: "color-mix(in srgb, var(--mode-rival) 10%, transparent)",
                    }
                  : { borderColor: "color-mix(in srgb, var(--c-ink) 15%, transparent)", opacity: 0.6 }
              }
            >
              {t(`zona.${z}`)}
            </button>
          );
        })}
      </div>

      {zonas.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed opacity-70">{t("preAviso")}</p>
      )}

      {/* recuperación del día — el juego también cuida al jugador */}
      <div className="mt-4 pt-3 border-t border-ink/8">
        <p className="text-[10px] mono uppercase tracking-[0.18em] text-signal-deep mb-1">
          {t("recupTitle")}
        </p>
        <p className="text-xs leading-relaxed opacity-80">{tip.tip}</p>
        <p className="text-xs leading-relaxed opacity-55 mt-0.5">{tip.alternativa}</p>
      </div>
    </section>
  );
}
