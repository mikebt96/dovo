import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// F11 · El esquema de entrenamiento como ciudadano de primera: ruta top-level en la nav
// que resuelve tu grupo y aterriza en la semana prescrita (antes solo se llegaba
// navegando grupo → rutina — nadie la encontraba).
export default async function EntrenamientoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: miembro, error } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("trato_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ trato_id: string }>();
  if (error) console.error("[entrenamiento] miembro:", error.message);

  if (!miembro) redirect("/onboarding/grupo");
  redirect(`/grupo/${miembro.trato_id}/rutina`);
}
