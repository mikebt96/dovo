"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { salirDelTrato } from "@/lib/actions/grupos";

// F27 · Salir del grupo (zona de peligro): doble confirmación — primer tap
// arma + explica las consecuencias, segundo tap ejecuta.
export default function SalirGrupoButton({
  tratoId,
  ultimo,
}: {
  tratoId: string;
  ultimo: boolean; // soy el único miembro: salir archiva el grupo
}) {
  const t = useTranslations("grupo");
  const router = useRouter();
  const [armado, setArmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function salir() {
    if (!armado) {
      setArmado(true);
      return;
    }
    setError(null);
    start(async () => {
      const r = await salirDelTrato(tratoId);
      if (!r.ok) {
        setError(r.error);
        setArmado(false);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div>
      {armado && (
        <p className="text-xs leading-relaxed opacity-70 mb-3">
          {ultimo ? t("leaveAvisoUltimo") : t("leaveAviso")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={salir}
          disabled={pending}
          className={`text-[11px] mono uppercase tracking-[0.16em] underline-offset-4 transition-colors disabled:opacity-50 ${
            armado
              ? "text-rival-deep underline decoration-rival/50"
              : "opacity-50 hover:opacity-80 underline decoration-ink/30"
          }`}
        >
          {pending ? t("leaving") : armado ? t("leaveConfirm") : t("leaveGroup")}
        </button>
        {armado && !pending && (
          <button
            type="button"
            onClick={() => setArmado(false)}
            className="text-[11px] mono uppercase tracking-[0.16em] opacity-50 hover:opacity-80"
          >
            {t("leaveNo")}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rival-deep mt-2">{error}</p>}
    </div>
  );
}
