"use client";

import { useState, useTransition } from "react";
import { savePreferences, sendTestMessage } from "./actions";
import type { DietaryProfile, DietaryTag, NotificationSettings } from "@/lib/types";

const TAG_OPTIONS: { id: DietaryTag; label: string; glyph: string }[] = [
  { id: "vegetarian",  label: "Vegetariana",   glyph: "🥗" },
  { id: "vegan",       label: "Vegana",        glyph: "🌱" },
  { id: "pescatarian", label: "Pescetariana",  glyph: "🐟" },
  { id: "keto",        label: "Keto",          glyph: "🥑" },
  { id: "paleo",       label: "Paleo",         glyph: "🍖" },
  { id: "no-gluten",   label: "Sin gluten",    glyph: "🌾" },
  { id: "no-dairy",    label: "Sin lácteos",   glyph: "🥛" },
  { id: "no-eggs",     label: "Sin huevo",     glyph: "🥚" },
];

const INPUT_CLASS = "input-bare";
const INPUT_MONO = "input-bare input-mono";

export default function PreferencesForm({
  slug,
  color,
  initial,
  notifications,
}: {
  slug: string;
  color: string;
  initial: DietaryProfile;
  notifications: NotificationSettings;
}) {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<DietaryTag[]>(initial.dietaryTags);
  const [waOptIn, setWaOptIn] = useState<boolean>(notifications.whatsappOptIn);
  const [testPending, startTest] = useTransition();
  const [testResult, setTestResult] = useState<
    { ok: true } | { ok: false; msg: string } | null
  >(null);

  function toggleTag(t: DietaryTag) {
    setTags((curr) =>
      curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]
    );
  }

  function submit(form: FormData) {
    form.delete("dietary_tags");
    for (const t of tags) form.append("dietary_tags", t);

    startTransition(async () => {
      const res = await savePreferences(slug, form);
      if (res.ok) {
        setWarnings([]);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setWarnings(res.warnings);
      }
    });
  }

  return (
    <form action={submit} className="space-y-8">
      <Field label="Código postal" hint="Para precios reales en tu sucursal">
        <input
          type="text"
          name="postal_code"
          inputMode="numeric"
          maxLength={5}
          pattern="\d{5}"
          defaultValue={initial.postalCode ?? ""}
          placeholder="06600"
          className={`${INPUT_MONO} max-w-[8rem]`}
        />
      </Field>

      <Field label="Tipo de dieta" hint="Marca todo lo que aplique">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {TAG_OPTIONS.map((t) => {
            const on = tags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className="text-left transition border px-3 py-3"
                style={{
                  borderColor: on ? color : "var(--color-divider-strong)",
                  background: on ? `${color}12` : "transparent",
                  color: on ? color : "var(--color-text)",
                }}
                aria-pressed={on}
              >
                <p className="text-lg leading-none mb-1.5">{t.glyph}</p>
                <p className="mono text-[10px] uppercase tracking-widest">
                  {t.label}
                </p>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Alergias" hint="Separadas por coma">
        <input
          type="text"
          name="allergens"
          defaultValue={initial.allergens.join(", ")}
          placeholder="cacahuate, mariscos, ajonjolí"
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        label="Ingredientes que NO te gustan"
        hint="La AI los evitará al rediseñar comidas"
      >
        <input
          type="text"
          name="disliked_ingredients"
          defaultValue={initial.dislikedIngredients.join(", ")}
          placeholder="cilantro, aceitunas, hongos"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Ingredientes que AMAS" hint="La AI los priorizará">
        <input
          type="text"
          name="liked_ingredients"
          defaultValue={initial.likedIngredients.join(", ")}
          placeholder="aguacate, tofu, limón"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Texturas que no te gustan" hint="Opcional">
        <input
          type="text"
          name="disliked_textures"
          defaultValue={initial.dislikedTextures.join(", ")}
          placeholder="gomoso, crujiente"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Kcal máx por comida" hint="Opcional — la AI respeta este tope">
        <input
          type="number"
          name="max_meal_kcal"
          defaultValue={initial.maxMealKcal ?? ""}
          placeholder="700"
          className={`${INPUT_MONO} max-w-[8rem]`}
        />
      </Field>

      <Field label="Notas libres para la AI" hint="Cualquier cosa adicional">
        <textarea
          name="notes_for_ai"
          defaultValue={initial.notesForAi ?? ""}
          placeholder="No me gusta cocinar más de 10 minutos. Prefiero microondas."
          rows={3}
          className={`${INPUT_CLASS} resize-y`}
          style={{ borderBottom: "1px solid var(--color-divider-strong)" }}
        />
      </Field>

      {/* WhatsApp notifications */}
      <div
        className="surface p-5 space-y-4"
        style={{ borderLeft: `2px solid ${color}` }}
      >
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <p className="font-bold text-sm">Avisos por WhatsApp</p>
            <p className="mono text-[10px] tracking-wider text-[color:var(--color-text-3)] mt-1">
              Cuando la AI rediseñe tu plan, te llega un resumen
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="whatsapp_opt_in"
              checked={waOptIn}
              onChange={(e) => setWaOptIn(e.target.checked)}
              className="w-4 h-4"
              style={{ accentColor: color }}
            />
            <span className="mono text-[10px] uppercase tracking-widest" style={{ color: waOptIn ? color : "var(--color-text-3)" }}>
              {waOptIn ? "activado" : "apagado"}
            </span>
          </label>
        </div>
        <Field label="Teléfono E.164" hint="Con código país, sin espacios. Ej: 5215512345678">
          <input
            type="tel"
            name="phone_e164"
            defaultValue={notifications.phoneE164 ?? ""}
            placeholder="5215512345678"
            disabled={!waOptIn}
            className={`${INPUT_MONO} disabled:opacity-40`}
            inputMode="tel"
          />
        </Field>
        <Field label="CallMeBot API key" hint="Setup one-time (instrucciones abajo). Solo dígitos.">
          <input
            type="text"
            name="callmebot_api_key"
            defaultValue={notifications.callmebotApiKey ?? ""}
            placeholder="1234567"
            disabled={!waOptIn}
            className={`${INPUT_MONO} disabled:opacity-40`}
            inputMode="numeric"
            pattern="\d+"
          />
        </Field>
        {waOptIn && !notifications.callmebotApiKey && (
          <div
            className="text-xs text-[color:var(--color-text-2)] leading-relaxed space-y-1"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <p className="font-bold not-italic" style={{ fontFamily: "inherit" }}>
              Setup (30 segundos, una vez):
            </p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>Agrega el contacto <strong>+34 644 51 65 76</strong> a tu WA</li>
              <li>Mándale: <code className="mono text-[11px] px-1 bg-[color:var(--color-bg-2,rgba(255,255,255,0.05))]">I allow callmebot to send me messages</code></li>
              <li>Te responde con tu <strong>API key</strong> (~6-8 dígitos). Pégala arriba.</li>
            </ol>
          </div>
        )}

        {/* Test button — solo si ya hay credenciales guardadas + opt-in */}
        {notifications.callmebotApiKey && notifications.phoneE164 && (
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={testPending || !waOptIn}
              onClick={() => {
                setTestResult(null);
                startTest(async () => {
                  const res = await sendTestMessage(slug);
                  setTestResult(
                    res.ok
                      ? { ok: true }
                      : { ok: false, msg: res.error ?? "Falló sin razón" },
                  );
                });
              }}
              className="mono text-[10px] tracking-widest uppercase px-3 py-2 border border-[color:var(--color-divider-strong)] hover:border-[color:var(--color-text)] transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: waOptIn ? color : "var(--color-text-3)" }}
            >
              {testPending ? "Enviando…" : "Enviar test →"}
            </button>
            {testResult && (
              <p
                className="mono text-[10px] uppercase tracking-widest"
                style={{
                  color: testResult.ok
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                }}
              >
                {testResult.ok
                  ? "✓ Mensaje enviado. Revisa tu WhatsApp."
                  : `✕ ${testResult.msg}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          className="surface p-5"
          style={{ borderLeft: "2px solid var(--color-warning)" }}
        >
          <p className="mono text-[10px] uppercase tracking-widest text-[color:var(--color-warning)] mb-3">
            Aviso · combinaciones contradictorias
          </p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li
                key={i}
                className="text-sm italic text-[color:var(--color-text-2)] leading-relaxed"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                · {w}
              </li>
            ))}
          </ul>
          <input type="hidden" name="force_save" value="1" />
          <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] mt-3">
            Clic en guardar de nuevo para forzar.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4 flex-wrap pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn-ink disabled:opacity-50"
        >
          {isPending ? "guardando..." : "Guardar declaración →"}
        </button>
        {status === "saved" && (
          <span
            className="mono text-[10px] tracking-widest uppercase"
            style={{ color: "var(--color-success)" }}
          >
            ✓ guardado · AI rediseñando
          </span>
        )}
      </div>
    </form>
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
    <div>
      <label className="block mb-1">
        <p className="font-bold text-sm">{label}</p>
        {hint && (
          <p className="mono text-[10px] tracking-wider text-[color:var(--color-text-3)] mt-0.5">
            {hint}
          </p>
        )}
      </label>
      {children}
    </div>
  );
}
