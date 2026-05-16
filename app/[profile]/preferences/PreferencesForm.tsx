"use client";

import { useState, useTransition } from "react";
import { savePreferences } from "./actions";
import type { DietaryProfile, DietaryTag } from "@/lib/types";

const TAG_OPTIONS: { id: DietaryTag; label: string; emoji: string }[] = [
  { id: "vegetarian",  label: "Vegetariana",   emoji: "🥗" },
  { id: "vegan",       label: "Vegana",        emoji: "🌱" },
  { id: "pescatarian", label: "Pescetariana",  emoji: "🐟" },
  { id: "keto",        label: "Keto",          emoji: "🥑" },
  { id: "paleo",       label: "Paleo",         emoji: "🍖" },
  { id: "no-gluten",   label: "Sin gluten",    emoji: "🌾" },
  { id: "no-dairy",    label: "Sin lácteos",   emoji: "🥛" },
  { id: "no-eggs",     label: "Sin huevo",     emoji: "🥚" },
];

export default function PreferencesForm({
  slug,
  color,
  initial,
}: {
  slug: string;
  color: string;
  initial: DietaryProfile;
}) {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<DietaryTag[]>(initial.dietaryTags);

  function toggleTag(t: DietaryTag) {
    setTags((curr) =>
      curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]
    );
  }

  function submit(form: FormData) {
    // Re-inyecta tags (controlled state)
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
    <form action={submit} className="space-y-6">
      {/* CP */}
      <Field label="Código postal" hint="Para precios reales de tu sucursal">
        <input
          type="text"
          name="postal_code"
          inputMode="numeric"
          maxLength={5}
          pattern="\d{5}"
          defaultValue={initial.postalCode ?? ""}
          placeholder="06600"
          className="input w-32"
        />
      </Field>

      {/* Dietary tags */}
      <Field label="Tipo de dieta" hint="Marca todo lo que aplique">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TAG_OPTIONS.map((t) => {
            const on = tags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className="rounded p-3 text-left transition border"
                style={{
                  borderColor: on ? color : "var(--color-border)",
                  background: on ? `${color}15` : "var(--color-card-2)",
                  color: on ? color : "var(--color-text)",
                }}
              >
                <p className="text-lg">{t.emoji}</p>
                <p className="mono text-[10px] uppercase tracking-widest mt-1">
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
          className="input"
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
          className="input"
        />
      </Field>

      <Field
        label="Ingredientes que AMAS"
        hint="La AI los priorizará"
      >
        <input
          type="text"
          name="liked_ingredients"
          defaultValue={initial.likedIngredients.join(", ")}
          placeholder="aguacate, tofu, limón"
          className="input"
        />
      </Field>

      <Field label="Texturas que no te gustan" hint="Opcional">
        <input
          type="text"
          name="disliked_textures"
          defaultValue={initial.dislikedTextures.join(", ")}
          placeholder="gomoso, crujiente"
          className="input"
        />
      </Field>

      <Field label="Kcal máx por comida" hint="Opcional — la AI respeta este tope">
        <input
          type="number"
          name="max_meal_kcal"
          defaultValue={initial.maxMealKcal ?? ""}
          placeholder="700"
          className="input w-32"
        />
      </Field>

      <Field label="Notas libres para la AI" hint="Cualquier cosa adicional">
        <textarea
          name="notes_for_ai"
          defaultValue={initial.notesForAi ?? ""}
          placeholder="No me gusta cocinar más de 10 minutos. Prefiero microondas."
          rows={3}
          className="input w-full"
        />
      </Field>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="card p-4 border-l-2 border-[var(--color-orange)]">
          <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-orange)] mb-2">
            Aviso: combinaciones contradictorias
          </p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm">⚠️ {w}</li>
            ))}
          </ul>
          <input type="hidden" name="force_save" value="1" />
          <p className="mono text-[10px] text-[var(--color-muted)] mt-2">
            Da clic en guardar de nuevo para forzar.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 font-bold rounded transition disabled:opacity-50"
          style={{ background: color, color: "#000" }}
        >
          {isPending ? "Guardando..." : "Guardar preferencias"}
        </button>
        {status === "saved" && (
          <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-green)]">
            ✓ Guardado · AI rediseñando tus comidas...
          </p>
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
      <label className="block mb-2">
        <p className="font-bold text-sm">{label}</p>
        {hint && (
          <p className="mono text-[10px] text-[var(--color-muted)] mt-0.5">
            {hint}
          </p>
        )}
      </label>
      {children}
    </div>
  );
}
