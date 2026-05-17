import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=invalid_code`);
  }

  // Si es primer login, crear el row en core.users
  const meta = data.user.user_metadata as { nombre?: string; intent?: string };
  if (meta.intent === "sign_up" || meta.nombre) {
    const { error: insertError } = await supabase
      .schema("core")
      .from("users")
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        nombre: meta.nombre ?? "sin nombre",
        access_channel: "fcfs", // los curados se setean manualmente en BD
      }, { onConflict: "id" });

    if (insertError) {
      console.error("[auth/callback] insert core.users falló:", insertError);
    }

    // Crear row inicial en user_scores
    await supabase.schema("core").from("user_scores").upsert({
      user_id: data.user.id,
    }, { onConflict: "user_id" });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
