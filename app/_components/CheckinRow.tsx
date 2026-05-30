"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { crearCheckin } from "@/lib/actions/checkins";

type Props = {
  miembroId: string;
  actividadId: string;
  nombre: string;
  metricasRequeridas: string[]; // ej ['peso_kg','reps','sets'] | ['tiempo_min','intensidad']
  duracionDefault: number; // de la rutina
};

const HOY = () => new Date().toISOString().slice(0, 10);

export default function CheckinRow({
  miembroId,
  actividadId,
  nombre,
  metricasRequeridas,
  duracionDefault,
}: Props) {
  const t = useTranslations("checkin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function log(metricas: Record<string, number>, duracionMin: number) {
    setError(null);
    start(async () => {
      const res = await crearCheckin({
        miembroId,
        actividadId,
        fecha: HOY(),
        metricas,
        duracionMin,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      setOpen(false);
      router.refresh(); // refresca stats + racha del home
    });
  }

  function quickLog() {
    log({}, duracionDefault); // smart default: solo duración de la rutina
  }
  function detailedLog() {
    const metricas: Record<string, number> = {};
    for (const m of metricasRequeridas) metricas[m] = Number(vals[m] ?? 0);
    const dur = metricas.tiempo_min || duracionDefault;
    log(metricas, dur);
  }

  return (
    <div className="border border-ink/15 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="display font-medium lowercase">{nombre}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
          >
            {t("details")}
          </button>
          <button
            type="button"
            onClick={quickLog}
            disabled={pending || done}
            className="bg-ink text-papel px-4 py-2 rounded-full text-sm lowercase disabled:opacity-50 hover:bg-signal hover:text-white transition-colors"
          >
            {done ? t("done") : pending ? t("saving") : t("quickLog")}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {metricasRequeridas.map((m) => (
              <label key={m} className="block">
                <span className="text-[10px] uppercase tracking-wider opacity-60 block mb-1">
                  {t(`metric.${m}`)}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={vals[m] ?? ""}
                  onChange={(e) => setVals((v) => ({ ...v, [m]: e.target.value }))}
                  className="w-full bg-transparent border-b border-ink/40 pb-1 focus:outline-none focus:border-signal"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={detailedLog}
            disabled={pending}
            className="text-xs uppercase tracking-widest underline decoration-signal/40 underline-offset-4 disabled:opacity-50"
          >
            {t("logDetailed")}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
