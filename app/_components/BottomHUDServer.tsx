import { createClient } from "@/lib/supabase/server";
import { getBoostActivo } from "@/lib/actions/boosts";
import { hoyCDMX } from "@/lib/workout/fecha";
import BottomHUD from "./BottomHUD";

// Wrapper server del HUD (directiva §4.4): fetchea los recursos del juego.
// · munición = check-in de HOY CDMX (misma regla que getDuelContext)
// · escudo = boost tipo escudo vigente sin consumir
// Se monta en DOS puntos — app/(app)/layout.tsx y home-authed.tsx — porque la
// home vive fuera del route group (app).
export default async function BottomHUDServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: miembros }, boost] = await Promise.all([
    supabase
      .schema("core")
      .from("trato_miembros")
      .select("id")
      .eq("user_id", user.id),
    getBoostActivo(),
  ]);

  let ammo = false;
  const ids = (miembros ?? []).map((m) => (m as { id: string }).id);
  if (ids.length) {
    const { data: checkinHoy } = await supabase
      .schema("core")
      .from("checkins")
      .select("id")
      .in("miembro_id", ids)
      .eq("fecha", hoyCDMX())
      .limit(1)
      .maybeSingle<{ id: string }>();
    ammo = !!checkinHoy;
  }

  return <BottomHUD ammo={ammo} shield={boost?.tipo === "escudo"} />;
}
