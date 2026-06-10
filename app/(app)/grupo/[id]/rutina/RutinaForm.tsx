"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { guardarRutina } from "@/lib/actions/rutina";

type Actividad = {
  id: string;
  slug: string;
  nombre: string;
  metricas_requeridas: string[];
};
type Item = { actividad_id: string; frecuencia_semanal: number; duracion_min: number };
type Inicial = { nombre: string; actividades: unknown } | null;

export default function RutinaForm({
  grupoId,
  miembroId,
  actividades,
  inicial,
}: {
  grupoId: string;
  miembroId: string;
  actividades: Actividad[];
  inicial: Inicial;
}) {
  const t = useTranslations("rutina");
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "mi rutina");
  const [items, setItems] = useState<Item[]>(
    Array.isArray(inicial?.actividades) ? (inicial!.actividades as Item[]) : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(actId: string) {
    setItems((prev) =>
      prev.some((i) => i.actividad_id === actId)
        ? prev.filter((i) => i.actividad_id !== actId)
        : [...prev, { actividad_id: actId, frecuencia_semanal: 3, duracion_min: 60 }],
    );
  }
  function patch(actId: string, k: "frecuencia_semanal" | "duracion_min", v: number) {
    setItems((prev) => prev.map((i) => (i.actividad_id === actId ? { ...i, [k]: v } : i)));
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await guardarRutina({
        miembro_id: miembroId,
        nombre,
        is_default: true,
        is_travel: false,
        actividades: items,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Edición desde /rutina (inicial != null): quédate y muestra el plan regenerado.
      // Onboarding (sin rutina previa): el flujo original al grupo.
      if (inicial) router.refresh();
      else router.push(`/grupo/${grupoId}`);
    });
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60 block mb-2">
          {t("nameLabel")}
        </span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full bg-transparent border-b border-ink/40 pb-2 focus:outline-none focus:border-signal"
        />
      </label>

      <div className="space-y-3">
        {actividades.map((a) => {
          const item = items.find((i) => i.actividad_id === a.id);
          const active = !!item;
          return (
            <div
              key={a.id}
              className={`border rounded-lg p-4 transition-colors ${
                active ? "border-signal" : "border-ink/15"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(a.id)}
                aria-pressed={active}
                aria-label={`${a.nombre} — ${active ? t("remove") : t("add")}`}
                className="flex items-center justify-between w-full min-h-11"
              >
                <span className="display font-medium lowercase">{a.nombre}</span>
                <span className="text-xs uppercase tracking-widest opacity-70">
                  {active ? t("remove") : t("add")}
                </span>
              </button>
              {item && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <NumField
                    label={t("freq")}
                    value={item.frecuencia_semanal}
                    min={1}
                    max={14}
                    onChange={(v) => patch(a.id, "frecuencia_semanal", v)}
                  />
                  <NumField
                    label={t("duration")}
                    value={item.duracion_min}
                    min={5}
                    max={300}
                    onChange={(v) => patch(a.id, "duracion_min", v)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending || items.length === 0}
        className="w-full bg-ink text-papel py-3 rounded-full display font-semibold lowercase disabled:opacity-50 hover:bg-signal hover:text-white transition-colors"
      >
        {pending ? t("saving") : t("save")}
      </button>
    </div>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest opacity-60 block mb-2">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent border-b border-ink/40 pb-2 focus:outline-none focus:border-signal"
      />
    </label>
  );
}
