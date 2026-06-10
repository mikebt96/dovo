"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { runBodyScan, type BodyScan } from "@/lib/actions/bodyscan";

// Flujo del análisis corporal (F6), client. Dos modos:
//  · live=false (sin key): SIN foto — botón directo a la estimación antropométrica
//    (sample honesto). Nada que consentir porque nada se sube.
//  · live=true: doble consentimiento explícito → captura → análisis → resultado.
// La preview de la foto vive solo en memoria del browser (object URL revocado al terminar).
export default function ScanFlow({ live }: { live: boolean }) {
  const t = useTranslations("scan");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<BodyScan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function submit() {
    setErr(null);
    startTransition(async () => {
      const fd = new FormData();
      if (live) {
        if (!file) {
          setErr(t("noPhoto"));
          return;
        }
        fd.set("photo", file);
        fd.set("consent", String(consent1));
        fd.set("consent2", String(consent2));
      }
      const res = await runBodyScan(fd);
      if (res.ok) {
        setResult(res.data);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setFile(null);
      } else {
        setErr(res.error);
      }
    });
  }

  if (result) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-7 sm:p-9 text-white"
        style={{
          background:
            "radial-gradient(130% 150% at 12% 0%, #16132a 0%, #0b0a14 55%, #07060d 100%)",
          boxShadow: "0 24px 60px -28px rgba(109,74,255,0.55)",
        }}
      >
        <p className="text-[11px] mono uppercase tracking-[0.22em] text-white/50 mb-6">
          {result.source === "ai" ? `✦ ${t("resultAi")}` : t("resultSample")}
        </p>
        <div className="flex gap-10">
          <Big label={t("fat")} value={result.grasa_pct} color="#c44aff" />
          <Big label={t("muscle")} value={result.musculo_pct} color="#aef03c" />
        </div>
        <p className="text-[10px] mono uppercase tracking-widest text-white/40 mt-4">
          {t("confidence")}: {t(`conf.${result.confianza}`)}
        </p>
        <ul className="mt-6 space-y-2 text-sm text-white/80">
          {result.recomendaciones.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-signal shrink-0">→</span>
              {r}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-7 text-[11px] mono uppercase tracking-[0.14em] text-white/60 underline underline-offset-4 hover:text-white"
        >
          {t("again")}
        </button>
      </div>
    );
  }

  if (!live) {
    return (
      <div className="rounded-2xl border border-ink/10 p-6">
        <p className="text-sm opacity-70 leading-relaxed max-w-md mb-2">{t("samplePitch")}</p>
        <p className="text-[10px] mono uppercase tracking-[0.16em] text-signal mb-6">
          ✦ {t("sampleAiSoon")}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors disabled:opacity-60"
        >
          {pending ? t("working") : t("sampleCta")}
        </button>
        {err && (
          <p className="text-xs mono uppercase tracking-wider text-red-600/80 mt-3">{err}</p>
        )}
      </div>
    );
  }

  const canShoot = consent1 && consent2;

  return (
    <div className="rounded-2xl border border-ink/10 p-6 space-y-6">
      {/* Doble consentimiento ANTES de poder elegir foto */}
      <div className="space-y-3">
        <Consent checked={consent1} onChange={setConsent1} label={t("consent1")} />
        <Consent checked={consent2} onChange={setConsent2} label={t("consent2")} />
      </div>

      <div className={canShoot ? "" : "opacity-40 pointer-events-none select-none"}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={onPick}
          className="hidden"
        />
        {previewUrl ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={t("previewAlt")}
              className="h-28 w-20 object-cover rounded-xl border border-ink/15"
            />
            <div className="space-y-2">
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors disabled:opacity-60"
              >
                {pending ? t("working") : t("analyze")}
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-[11px] mono uppercase tracking-[0.14em] opacity-60 hover:opacity-100 underline underline-offset-4"
              >
                {t("retake")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-ink/25 py-10 text-center hover:border-signal/60 transition-colors"
          >
            <span className="block text-3xl mb-2">📸</span>
            <span className="text-sm opacity-70">{t("pickPhoto")}</span>
            <span className="block text-[10px] mono uppercase tracking-widest opacity-40 mt-2">
              {t("pickHint")}
            </span>
          </button>
        )}
      </div>

      {pending && (
        <p className="text-[11px] mono uppercase tracking-[0.16em] text-signal animate-pulse">
          {t("privacyCountdown")}
        </p>
      )}
      {err && <p className="text-xs mono uppercase tracking-wider text-red-600/80">{err}</p>}
    </div>
  );
}

function Consent({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[#6d4aff]"
      />
      <span className="text-sm opacity-75 leading-relaxed">{label}</span>
    </label>
  );
}

function Big({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div
        className="display font-extrabold leading-[0.85] text-5xl sm:text-6xl tabular-nums"
        style={{ color, textShadow: `0 0 40px ${color}55` }}
      >
        {value}%
      </div>
      <div className="text-[10px] mono uppercase tracking-[0.2em] text-white/50 mt-2">{label}</div>
    </div>
  );
}
