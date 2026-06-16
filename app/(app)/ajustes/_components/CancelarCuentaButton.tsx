"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancelarCuenta } from "@/lib/actions/cuenta";

// F26 · Cancelar cuenta (aviso §13): doble confirmación — primer tap arma el
// botón y muestra las consecuencias; segundo tap ejecuta. La eliminación es
// inmediata e irreversible.
export default function CancelarCuentaButton() {
  const t = useTranslations("ajustes");
  const router = useRouter();
  const [armado, setArmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function cancelar() {
    if (!armado) {
      setArmado(true);
      return;
    }
    setError(null);
    start(async () => {
      const res = await cancelarCuenta();
      if (!res.ok) {
        setError(res.error);
        setArmado(false);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      {armado && (
        <p className="text-xs leading-relaxed opacity-70 mb-3">
          {t("cancelarAviso")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={cancelar}
          disabled={pending}
          className={`text-[11px] mono uppercase tracking-[0.16em] underline-offset-4 transition-colors disabled:opacity-50 ${
            armado
              ? "text-rival-deep underline decoration-rival/50"
              : "opacity-50 hover:opacity-80 underline decoration-ink/30"
          }`}
        >
          {pending
            ? t("cancelando")
            : armado
              ? t("cancelarConfirm")
              : t("cancelarCuenta")}
        </button>
        {armado && !pending && (
          <button
            type="button"
            onClick={() => setArmado(false)}
            className="text-[11px] mono uppercase tracking-[0.16em] opacity-50 hover:opacity-80"
          >
            {t("cancelarNo")}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rival-deep mt-2">{error}</p>}
    </div>
  );
}
