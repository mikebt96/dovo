"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistResult } from "./actions";

/**
 * Form de waitlist — progressive enhancement.
 *
 * - Sin JS: funciona vía server action, full page round-trip.
 * - Con JS: `useActionState` da pending + result sin reload.
 * - El input de relationship es radio con look mono (no select), porque
 *   en pantalla pequeña los selects nativos rompen el editorial.
 * - `alreadyIn` se trata como éxito suave: "ya estabas dentro".
 */
export default function WaitlistForm() {
  const [state, formAction, pending] = useActionState<WaitlistResult | null, FormData>(
    joinWaitlist,
    null,
  );

  if (state?.ok) {
    return (
      <div className="border border-[color:var(--color-divider-strong)] p-8 md:p-10">
        <p className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-accent)] mb-4">
          Trato hecho ·
        </p>
        <p
          className="lowercase leading-[0.95] tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)",
            letterSpacing: "-0.03em",
          }}
        >
          {state.alreadyIn ? "ya estabas dentro." : "estás dentro de los 200."}
        </p>
        <p className="mt-5 text-[color:var(--color-text-2)] max-w-md">
          Cuando abramos el cupo, te llega el link al email que diste.
          Mientras tanto: no te apuntes con tu otro — uno solo basta.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-2">
        <label
          htmlFor="email"
          className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)]"
        >
          Tu email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className="bg-transparent border-b border-[color:var(--color-divider-strong)] py-3 text-lg lowercase tracking-tight focus:outline-none focus:border-[color:var(--color-accent)] transition-colors"
          style={{ fontFamily: "var(--font-display)" }}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="duo_name"
          className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)]"
        >
          Nombre del dúo <span className="text-[color:var(--color-text-4)] normal-case">(opcional)</span>
        </label>
        <input
          id="duo_name"
          name="duo_name"
          type="text"
          maxLength={60}
          placeholder="mike & andy · los hermanos · el reto del año"
          className="bg-transparent border-b border-[color:var(--color-divider-strong)] py-3 text-base lowercase tracking-tight focus:outline-none focus:border-[color:var(--color-accent)] transition-colors"
          style={{ fontFamily: "var(--font-display)" }}
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)]">
          ¿Qué tipo de dúo?
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="cursor-pointer border border-[color:var(--color-divider)] hover:border-[color:var(--color-divider-strong)] has-[:checked]:border-[color:var(--color-accent)] has-[:checked]:bg-[color:var(--color-accent-soft)] has-[:checked]:text-[color:var(--color-accent)] px-3 py-3 text-center text-sm lowercase tracking-tight transition"
            >
              <input
                type="radio"
                name="relationship"
                value={opt.value}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.ok === false && (
        <p className="mono text-xs tracking-widest text-[color:var(--color-danger)]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-ink justify-self-start disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Apuntando…" : "Apartar lugar →"}
      </button>

      <p className="mono text-[10px] tracking-[0.18em] uppercase text-[color:var(--color-text-4)]">
        Sin spam · solo el link cuando abramos · puedes salir cuando quieras
      </p>
    </form>
  );
}

const RELATIONSHIP_OPTIONS = [
  { value: "pareja", label: "pareja" },
  { value: "amigos", label: "amigos" },
  { value: "rivales", label: "rivales" },
  { value: "otros", label: "otros" },
] as const;
