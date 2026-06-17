"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveProfileFisico } from "@/lib/actions/perfil";
import { setConsentimiento } from "@/lib/actions/salud";
import {
  NIVELES_ACTIVIDAD,
  OBJETIVOS,
  EXPERIENCIAS,
} from "@/lib/schemas/perfil-fisico";

export default function PerfilForm() {
  const t = useTranslations("onboarding");
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
  // jamás pre-palomeado: consentimiento EXPRESO de datos sensibles (aviso §5)
  const [consentSalud, setConsentSalud] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // validación por campo: el usuario sabe QUÉ corregir antes de mandar, no
  // después de un error genérico del server (rangos = los del zod schema)
  const [errs, setErrs] = useState<{ peso?: string; altura?: string; edad?: string }>({});
  const refs = {
    peso: useRef<HTMLInputElement>(null),
    altura: useRef<HTMLInputElement>(null),
    edad: useRef<HTMLInputElement>(null),
  };
  const [pending, start] = useTransition();

  function validar() {
    const e: typeof errs = {};
    const p = Number(peso);
    const a = Number(altura);
    const ed = Number(edad);
    if (!peso.trim() || Number.isNaN(p) || p < 20 || p > 400) e.peso = t("errWeight");
    if (!altura.trim() || Number.isNaN(a) || a < 80 || a > 260) e.altura = t("errHeight");
    if (!edad.trim() || Number.isNaN(ed) || ed < 18 || ed > 120) e.edad = t("errAge");
    return e;
  }

  function submit() {
    setError(null);
    const e = validar();
    setErrs(e);
    const primer = (["peso", "altura", "edad"] as const).find((k) => e[k]);
    if (primer) {
      refs[primer].current?.focus();
      return;
    }
    start(async () => {
      const res = await saveProfileFisico(
        {
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
        },
        consentSalud,
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/onboarding/grupo");
    });
  }

  // borde rojo + limpia el error del campo al editarlo (feedback inmediato)
  const inputCls = (err?: string) =>
    `w-full bg-transparent border-b pb-2 focus:outline-none ${
      err ? "border-rival" : "border-ink/40 focus:border-signal"
    }`;
  const limpiar = (k: "peso" | "altura" | "edad") =>
    setErrs((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 items-start">
        <Field label={t("labelWeight")} error={errs.peso}>
          <input
            ref={refs.peso}
            type="number"
            inputMode="decimal"
            value={peso}
            aria-invalid={!!errs.peso}
            onChange={(e) => {
              setPeso(e.target.value);
              limpiar("peso");
            }}
            className={inputCls(errs.peso)}
          />
        </Field>
        <Field label={t("labelHeight")} error={errs.altura}>
          <input
            ref={refs.altura}
            type="number"
            inputMode="decimal"
            value={altura}
            aria-invalid={!!errs.altura}
            onChange={(e) => {
              setAltura(e.target.value);
              limpiar("altura");
            }}
            className={inputCls(errs.altura)}
          />
        </Field>
        <Field label={t("labelAge")} error={errs.edad}>
          <input
            ref={refs.edad}
            type="number"
            inputMode="numeric"
            value={edad}
            aria-invalid={!!errs.edad}
            onChange={(e) => {
              setEdad(e.target.value);
              limpiar("edad");
            }}
            className={inputCls(errs.edad)}
          />
        </Field>
      </div>

      <Field label={t("labelGender")}>
        <div className="flex gap-2">
          {(["masculino", "femenino", "otro"] as const).map((g) => (
            <Chip key={g} active={genero === g} onClick={() => setGenero(g)}>
              {t(`gender.${g}`)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={t("labelActivity")}>
        <div className="flex flex-wrap gap-2">
          {NIVELES_ACTIVIDAD.map((n) => (
            <Chip
              key={n.value}
              active={nivel === n.value}
              onClick={() => setNivel(n.value)}
            >
              {t(`nivel.${n.value}`)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={t("labelGoal")}>
        <div className="flex flex-wrap gap-2">
          {OBJETIVOS.map((o) => (
            <Chip
              key={o.value}
              active={objetivo === o.value}
              onClick={() => setObjetivo(o.value)}
            >
              {t(`objetivo.${o.value}`)}
            </Chip>
          ))}
        </div>
      </Field>

      {!showMas ? (
        <button
          type="button"
          onClick={() => setShowMas(true)}
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 underline decoration-signal/40 underline-offset-4"
        >
          {t("moreData")}
        </button>
      ) : (
        <div className="space-y-6 border-t border-ink/15 pt-6">
          <Field label={t("labelExperience")}>
            <div className="flex gap-2">
              {EXPERIENCIAS.map((e) => (
                <Chip
                  key={e.value}
                  active={experiencia === e.value}
                  onClick={() => setExperiencia(e.value)}
                >
                  {t(`experiencia.${e.value}`)}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label={t("labelInjuries")}>
            <input
              value={lesiones}
              onChange={(e) => setLesiones(e.target.value)}
              placeholder={t("injuriesPlaceholder")}
              className="w-full bg-transparent border-b border-ink/40 pb-2 focus:outline-none focus:border-signal"
            />
          </Field>
        </div>
      )}

      {/* consentimiento expreso de salud — gate legal del perfil físico */}
      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-ink/15 p-4">
        <input
          type="checkbox"
          checked={consentSalud}
          onChange={(e) => setConsentSalud(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[var(--c-signal)] shrink-0"
        />
        <span className="text-xs leading-relaxed opacity-80">
          {t("consentSalud")}{" "}
          <a
            href="/privacidad"
            target="_blank"
            className="underline decoration-signal/40 underline-offset-2"
          >
            {t("consentSaludLink")}
          </a>
        </span>
      </label>

      {error && <p className="text-sm text-rival-deep">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !consentSalud}
        className="w-full bg-ink text-papel py-3 rounded-full display font-semibold lowercase disabled:opacity-50 hover:bg-signal hover:text-white transition-colors"
      >
        {pending ? t("saving") : t("next")}
      </button>

      {/* declinar es legítimo (aviso §5): la capa social del juego queda viva;
          se registra en bitácora que se preguntó y dijo no */}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await setConsentimiento("salud", false);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.push("/onboarding/grupo");
          });
        }}
        className="w-full text-center text-[11px] mono uppercase tracking-[0.16em] opacity-50 hover:opacity-80 transition-opacity py-1"
      >
        {t("skipSalud")}
      </button>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className={`text-xs uppercase tracking-widest block mb-2 ${
          error ? "text-rival-deep opacity-100" : "opacity-60"
        }`}
      >
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-[11px] text-rival-deep">{error}</span>}
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
      className={`px-3 py-2 text-sm lowercase border rounded-full transition-colors ${
        active
          ? "bg-signal text-white border-signal"
          : "border-ink/25 hover:border-signal"
      }`}
    >
      {children}
    </button>
  );
}
