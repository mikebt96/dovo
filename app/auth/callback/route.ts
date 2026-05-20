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

  // Resolver nombre: magic link trae meta.nombre, Google OAuth trae full_name/name.
  const meta = data.user.user_metadata as {
    nombre?: string;
    full_name?: string;
    name?: string;
  };
  const nombre =
    meta.nombre ?? meta.full_name ?? meta.name ?? "sin nombre";

  // Upsert core.users (idempotente). Crea row en primer login.
  const { error: insertError } = await supabase
    .schema("core")
    .from("users")
    .upsert(
      {
        id: data.user.id,
        email: data.user.email!,
        nombre,
        access_channel: "fcfs",
      },
      { onConflict: "id" },
    );
  if (insertError) {
    console.error("[auth/callback] insert core.users falló:", insertError);
  }

  // Crear rows iniciales del character system (idempotente).
  await supabase
    .schema("core")
    .from("user_character")
    .upsert({ user_id: data.user.id }, { onConflict: "user_id" });
  await supabase
    .schema("core")
    .from("user_streak")
    .upsert({ user_id: data.user.id }, { onConflict: "user_id" });

  return NextResponse.redirect(`${origin}${next}`);
}
