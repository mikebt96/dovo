import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Landing from "./_components/landing";
import HomeAuthed from "./_components/home-authed";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <Landing />;

  // Onboarding gate: sin perfil físico → paso 1; sin grupo → paso 2.
  // EXCEPCIÓN (aviso §5): quien declinó compartir datos de salud (última fila
  // de consentimiento 'salud' = no otorgado) juega la capa social sin perfil.
  // Si después lo otorga desde ajustes, este gate lo regresa a llenar perfil.
  const { data: perfil } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let sinSalud = false;
  if (!perfil) {
    const { data: cons, error: consErr } = await supabase
      .schema("core")
      .from("consentimientos")
      .select("otorgado")
      .eq("user_id", user.id)
      .eq("tipo", "salud")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ otorgado: boolean }>();
    if (consErr) console.error("[home] consentimiento salud:", consErr.message);
    if (cons && cons.otorgado === false) {
      sinSalud = true; // declinó explícitamente: capa social disponible
    } else {
      redirect("/onboarding/perfil");
    }
  }

  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!miembro) redirect("/onboarding/grupo");

  return <HomeAuthed sinSalud={sinSalud} />;
}
