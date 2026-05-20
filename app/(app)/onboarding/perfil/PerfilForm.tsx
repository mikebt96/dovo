"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfileFisico } from "@/lib/actions/perfil";
import {
  NIVELES_ACTIVIDAD,
  OBJETIVOS,
  EXPERIENCIAS,
} from "@/lib/schemas/perfil-fisico";

export default function PerfilForm() {
  const router = useRouter();
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState<"masculino" | "femenino" | "otro">(
    "masculino",
  );
  const [nivel, setNivel] = useState<(typeof NIVELES_ACTIVIDAD)[number]["value"]>(
    "moderado",
  );
  const [objetivo, setObjetivo] = useState<(typeof OBJETIVOS)[number]["value"]>(
    "mantener",
  );
  const [showMas, setShowMas] = useState(false);
  const [experiencia, setExperiencia] = useState<
    (typeof EXPERIENCIAS)[number]["value"] | ""
  >("");
  const [lesiones, setLesiones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await saveProfileFisico({
        peso_kg: Number(peso),
        altura_cm: Number(altura),
        edad: Number(edad),
        genero,
        nivel_actividad: nivel,
        objetivo,
        experiencia: experiencia || undefined,
        lesiones: lesiones
          ? lesiones.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/onboarding/grupo");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Peso (kg)">
          <input
            type="number"
            inputMode="decimal"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="w-full bg-papel border-b border-ink pb-2 focus:outline-none"
          />
        </Field>
        <Field label="Altura (cm)">
          <input
            type="number"
            inputMode="decimal"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            className="w-full bg-papel border-b border-ink pb-2 focus:outline-none"
          />
        </Field>
        <Field label="Edad">
          <input
            type="number"
            inputMode="numeric"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="w-full bg-papel border-b border-ink pb-2 focus:outline-none"
          />
        </Field>
      </div>

      <Field label="Género">
        <div className="flex gap-2">
          {(["masculino", "femenino", "otro"] as const).map((g) => (
            <Chip key={g} active={genero === g} onClick={() => setGenero(g)}>
              {g}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Nivel de actividad">
        <div className="flex flex-wrap gap-2">
          {NIVELES_ACTIVIDAD.map((n) => (
            <Chip
              key={n.value}
              active={nivel === n.value}
              onClick={() => setNivel(n.value)}
            >
              {n.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Objetivo">
        <div className="flex flex-wrap gap-2">
          {OBJETIVOS.map((o) => (
            <Chip
              key={o.value}
              active={objetivo === o.value}
              onClick={() => setObjetivo(o.value)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </Field>

      {!showMas ? (
        <button
          type="button"
          onClick={() => setShowMas(true)}
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 underline"
        >
          + más datos para mayor personalización
        </button>
      ) : (
        <div className="space-y-6 border-t border-ink/20 pt-6">
          <Field label="Experiencia">
            <div className="flex gap-2">
              {EXPERIENCIAS.map((e) => (
                <Chip
                  key={e.value}
                  active={experiencia === e.value}
                  onClick={() => setExperiencia(e.value)}
                >
                  {e.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Lesiones o limitaciones (separadas por coma)">
            <input
              value={lesiones}
              onChange={(e) => setLesiones(e.target.value)}
              placeholder="rodilla, hombro…"
              className="w-full bg-papel border-b border-ink pb-2 focus:outline-none"
            />
          </Field>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "guardando…" : "siguiente"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest opacity-60 block mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-sm lowercase border transition-colors ${
        active ? "bg-ink text-papel border-ink" : "border-ink/30 hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}
