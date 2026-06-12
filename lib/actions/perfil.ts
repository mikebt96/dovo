"use server";

import type { Result } from "@/lib/actions/result";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  perfilFisicoSchema,
  type PerfilFisicoInput,
} from "@/lib/schemas/perfil-fisico";

// BMR vía Mifflin-St Jeor. Para género "otro" promediamos las dos fórmulas.
function calcularBMR(input: PerfilFisicoInput): number {
  const base =
    10 * input.peso_kg + 6.25 * input.altura_cm - 5 * input.edad;
  if (input.genero === "masculino") return base + 5;
  if (input.genero === "femenino") return base - 161;
  return base + (5 - 161) / 2; // otro: promedio
}

export async function saveProfileFisico(
  input: PerfilFisicoInput,
): Promise<Result> {
  const parsed = perfilFisicoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "datos inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const bmr = calcularBMR(parsed.data);

  const { error } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .upsert(
      {
        user_id: user.id,
        peso_kg: parsed.data.peso_kg,
        altura_cm: parsed.data.altura_cm,
        edad: parsed.data.edad,
        genero: parsed.data.genero,
        nivel_actividad: parsed.data.nivel_actividad,
        objetivo: parsed.data.objetivo,
        experiencia: parsed.data.experiencia ?? null,
        lesiones: parsed.data.lesiones ?? null,
        bmr_calculado: Math.round(bmr * 100) / 100,
      },
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/ajustes");
  return { ok: true, data: undefined };
}
