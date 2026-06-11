"use server";

import { createClient } from "@/lib/supabase/server";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

// Ancla el lugar de una actividad (el candado del lugar). El jugador lo elige
// EXPLÍCITAMENTE desde el recibo de su check-in — la app jamás guarda ubicación
// que el usuario no haya pedido anclar. Re-anclar sobreescribe (te cambiaste
// de gym). RLS owner-only.
export async function anclarLugar(input: {
  actividadId: string;
  lat: number;
  lng: number;
}): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return { ok: false, error: "ubicación inválida" };
  }

  const { error } = await supabase
    .schema("core")
    .from("lugares")
    .upsert(
      {
        user_id: user.id,
        actividad_id: input.actividadId,
        lat: input.lat,
        lng: input.lng,
      },
      { onConflict: "user_id,actividad_id" },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
