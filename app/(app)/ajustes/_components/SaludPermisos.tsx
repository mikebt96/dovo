"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  marcarFuenteInteres,
  setConsentimiento,
  type EstadoSalud,
  type ProveedorSalud,
  type TipoConsentimiento,
} from "@/lib/actions/salud";

// F25 · Salud y permisos: consentimiento EXPRESO por toggle dedicado (jamás
// pre-palomeado — datos sensibles, ley MX). La conexión real a Apple Health /
// Health Connect llega con la app nativa; aquí se junta la waitlist.
export default function SaludPermisos({ initial }: { initial: EstadoSalud }) {
  const t = useTranslations("ajustes");
  const [estado, setEstado] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(tipo: TipoConsentimiento) {
    const next = !estado[tipo];
    setEstado((e) => ({ ...e, [tipo]: next }));
    setError(null);
    start(async () => {
      const res = await setConsentimiento(tipo, next);
      if (!res.ok) {
        setEstado((e) => ({ ...e, [tipo]: !next }));
        setError(t("consentError"));
      }
    });
  }

  function apuntar(proveedor: ProveedorSalud) {
    setEstado((e) => ({ ...e, fuentes: { ...e.fuentes, [proveedor]: "interesado" } }));
    setError(null);
    start(async () => {
      const res = await marcarFuenteInteres(proveedor);
      if (!res.ok) {
        setEstado((e) => {
          const fuentes = { ...e.fuentes };
          delete fuentes[proveedor];
          return { ...e, fuentes };
        });
        setError(t("consentError"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <Switch
        on={estado.salud}
        pending={pending}
        onToggle={() => toggle("salud")}
        title={estado.salud ? t("saludConsentOn") : t("saludConsentOff")}
        desc={t("saludConsentDesc")}
      />
      <Switch
        on={estado.ubicacion}
        pending={pending}
        onToggle={() => toggle("ubicacion")}
        title={estado.ubicacion ? t("ubicacionOn") : t("ubicacionOff")}
        desc={t("ubicacionDesc")}
      />

      {/* fuentes: la conexión nativa aún no existe en web — waitlist honesta */}
      {estado.salud && (
        <div className="rounded-xl border border-ink/10 p-4">
          <p className="text-[11px] mono uppercase tracking-[0.18em] opacity-70">
            {t("fuentesTitle")}
          </p>
          <p className="text-xs opacity-60 mt-1 leading-relaxed">{t("fuentesDesc")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["apple_health", t("fuenteApple")],
                ["health_connect", t("fuenteGoogle")],
              ] as Array<[ProveedorSalud, string]>
            ).map(([proveedor, label]) => {
              const apuntado = !!estado.fuentes[proveedor];
              return (
                <button
                  key={proveedor}
                  type="button"
                  disabled={pending || apuntado}
                  onClick={() => apuntar(proveedor)}
                  className={`rounded-full px-4 py-2 text-[12px] mono lowercase border transition-colors ${
                    apuntado
                      ? "border-signal/40 text-signal"
                      : "border-ink/20 hover:border-signal"
                  } disabled:opacity-70`}
                >
                  {label} · {apuntado ? t("fuenteApuntado") : t("fuenteInteres")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rival-deep">{error}</p>}
    </div>
  );
}

function Switch({
  on,
  pending,
  onToggle,
  title,
  desc,
}: {
  on: boolean;
  pending: boolean;
  onToggle: () => void;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          on ? "bg-signal" : "bg-ink/25"
        } disabled:opacity-50 shrink-0 mt-1`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-1 w-6 h-6 rounded-full bg-papel transition-transform ${
            on ? "translate-x-[32px]" : "translate-x-1"
          }`}
        />
      </button>
      <div className="flex-1">
        <p className="display font-semibold lowercase">{title}</p>
        <p className="text-xs opacity-70 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
