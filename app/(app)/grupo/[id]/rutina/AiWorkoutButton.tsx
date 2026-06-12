"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { regenerateWorkoutAi } from "@/lib/actions/workout";
import { EQUIPOS, type Equipo } from "@/lib/workout/catalog";
import type { WorkoutPrefs } from "@/lib/workout/types";

// F9 · "Personalizar con IA" (Pro). Fail-soft de F5: sin flag, chip "ia próximamente";
// sin tier, link a /suscripcion. Con acceso: panel compacto de prefs (equipo + lesiones)
// prellenado con lo último declarado (no se pierde al re-generar) — el page load jamás llama IA.
export default function AiWorkoutButton({
  grupoId,
  aiLive,
  entitledAi,
  prefsIniciales,
}: {
  grupoId: string;
  aiLive: boolean;
  entitledAi: boolean;
  prefsIniciales: WorkoutPrefs;
}) {
  const t = useTranslations("rutina");
  const [open, setOpen] = useState(false);
  const [equipo, setEquipo] = useState<Equipo[]>(
    () => (prefsIniciales.equipo ?? []).filter((e): e is Equipo => (EQUIPOS as readonly string[]).includes(e)),
  );
  const [lesiones, setLesiones] = useState(prefsIniciales.lesiones ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!aiLive) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[10px] mono uppercase tracking-[0.16em] opacity-50">
        ✦ {t("aiSoon")}
      </span>
    );
  }

  if (!entitledAi) {
    return (
      <Link
        href="/suscripcion"
        className="inline-flex items-center gap-2 rounded-full border border-signal/40 text-signal px-4 py-2 text-[10px] mono uppercase tracking-[0.16em] hover:bg-signal hover:text-white transition-colors"
      >
        ✦ {t("aiPro")}
      </Link>
    );
  }

  function toggleEquipo(e: Equipo) {
    setEquipo((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }

  function generar() {
    setMsg(null);
    start(async () => {
      const res = await regenerateWorkoutAi({
        grupoId,
        prefs: {
          equipo: equipo.length ? equipo : undefined,
          lesiones: lesiones.trim() || undefined,
        },
      });
      if (!res.ok) setMsg(res.error === "coming_soon" ? t("aiSoon") : res.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-signal text-white px-4 py-2 text-[10px] mono uppercase tracking-[0.16em] hover:bg-[#5a37e0] transition-colors"
        >
          ✦ {t("aiBtn")}
        </button>
        {msg && (
          <span className="text-[10px] mono uppercase tracking-wider text-rival-deep">{msg}</span>
        )}
      </span>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-ink/15 p-4 space-y-4">
      <div>
        <p className="text-[10px] mono uppercase tracking-[0.18em] opacity-60 mb-2">
          {t("equipoLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {EQUIPOS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => toggleEquipo(e)}
              className={`text-[10px] mono uppercase tracking-wider rounded-full border px-3 py-1.5 transition-colors ${
                equipo.includes(e)
                  ? "border-signal text-signal"
                  : "border-ink/20 opacity-60 hover:opacity-100"
              }`}
            >
              {t(`equipo.${e}`)}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="text-[10px] mono uppercase tracking-[0.18em] opacity-60 block mb-2">
          {t("lesionesLabel")}
        </span>
        <input
          value={lesiones}
          onChange={(e) => setLesiones(e.target.value)}
          maxLength={200}
          className="w-full bg-transparent border-b border-ink/30 pb-1.5 text-sm focus:outline-none focus:border-signal"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] mono uppercase tracking-[0.16em] opacity-50 hover:opacity-80"
        >
          {t("logCancel")}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={generar}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-signal text-white px-5 py-2 text-[10px] mono uppercase tracking-[0.16em] hover:bg-[#5a37e0] transition-colors disabled:opacity-60"
        >
          ✦ {pending ? t("aiWorking") : t("aiGenerate")}
        </button>
      </div>
      {msg && <p className="text-[11px] text-rival-deep">{msg}</p>}
    </div>
  );
}
