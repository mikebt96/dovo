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
  const { data: perfil } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil) redirect("/onboarding/perfil");

  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!miembro) redirect("/onboarding/grupo");

  return <HomeAuthed />;
}
