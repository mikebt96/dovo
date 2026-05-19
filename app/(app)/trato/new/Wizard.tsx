"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTrato } from "@/lib/actions/tratos";
import { FRECUENCIAS } from "@/lib/schemas/trato";

type Step = 1 | 2 | 3;

export default function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [goal, setGoal] = useState("");
  const [frecuencia, setFrecuencia] = useState<string>("daily");
  const [duracionDias, setDuracionDias] = useState<number>(30);
  const [recompensa, setRecompensa] = useState("");
  const [castigo, setCastigo] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");

  function nextStep() {
    setError(null);
    if (step === 1) {
      if (goal.trim().length < 3) {
        setError("el goal necesita al menos 3 caracteres");
        return;
      }
      if (duracionDias < 1 || duracionDias > 365) {
        setError("duración entre 1 y 365 días");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!recompensa.trim() || !castigo.trim()) {
        setError("recompensa y castigo no pueden estar vacíos");
        return;
      }
      setStep(3);
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("goal", goal);
    fd.set("frecuencia", frecuencia);
    fd.set("duracion_dias", String(duracionDias));
    fd.set("recompensa_text", recompensa);
    fd.set("castigo_text", castigo);
    fd.set("partner_email", partnerEmail);

    startTransition(async () => {
      const result = await createTrato(fd);
      if (result.ok) {
        router.push(`/trato/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      <StepIndicator step={step} />

      {step === 1 && (
        <section className="space-y-8">
          <Field label="¿Qué van a cumplir?">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="ej. ir al gym 3 veces por semana"
              rows={3}
              className="block w-full border-b border-ink pb-2 bg-transparent focus:outline-none resize-none"
              required
            />
          </Field>

          <Field label="¿Cada cuándo?">
            <div className="space-y-2 mt-1">
              {FRECUENCIAS.map((f) => (
                <label key={f.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="frecuencia_radio"
                    value={f.value}
                    checked={frecuencia === f.value}
                    onChange={() => setFrecuencia(f.value)}
                    className="accent-ink"
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="¿Cuántos días?">
            <input
              type="number"
              value={duracionDias}
              onChange={(e) => setDuracionDias(Number(e.target.value))}
              min={1}
              max={365}
              className="block w-32 border-b border-ink pb-2 bg-transparent focus:outline-none"
              required
            />
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-8">
          <Field
            label="Recompensa del que cumpla"
            hint="ej. el que cumpla elige la peli del finde"
          >
            <textarea
              value={recompensa}
              onChange={(e) => setRecompensa(e.target.value)}
              rows={2}
              className="block w-full border-b border-ink pb-2 bg-transparent focus:outline-none resize-none"
              required
            />
          </Field>

          <Field
            label="Castigo del que falle"
            hint="ej. el que falle paga el café por una semana"
          >
            <textarea
              value={castigo}
              onChange={(e) => setCastigo(e.target.value)}
              rows={2}
              className="block w-full border-b border-ink pb-2 bg-transparent focus:outline-none resize-none"
              required
            />
          </Field>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-8">
          <Field
            label="Correo del otro"
            hint="le mandamos el link después · si no tiene cuenta, se hace una"
          >
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="otro@correo.com"
              className="block w-full border-b border-ink pb-2 bg-transparent focus:outline-none"
              required
            />
          </Field>

          <div className="bg-papel-dark p-6 space-y-3 text-sm">
            <p className="syne text-lg lowercase">resumen</p>
            <p>
              <span className="opacity-60">goal:</span> {goal}
            </p>
            <p>
              <span className="opacity-60">cadencia:</span>{" "}
              {FRECUENCIAS.find((f) => f.value === frecuencia)?.label} ·{" "}
              {duracionDias} días
            </p>
            <p>
              <span className="opacity-60">recompensa:</span> {recompensa}
            </p>
            <p>
              <span className="opacity-60">castigo:</span> {castigo}
            </p>
          </div>
        </section>
      )}

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((step - 1) as Step)}
            className="px-6 py-3 border border-ink syne lowercase"
            disabled={pending}
          >
            ← atrás
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 bg-ink text-papel py-3 syne lowercase"
          >
            siguiente →
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
          >
            {pending ? "creando..." : "hacer el trato"}
          </button>
        )}
      </div>
    </form>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex gap-2 mb-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`h-1 flex-1 ${n <= step ? "bg-ink" : "bg-papel-darker"}`}
        />
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest opacity-60 mb-2">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block mt-1 text-xs opacity-50 italic">{hint}</span>
      )}
    </label>
  );
}
