import { NextResponse, type NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * POST /auth/sign-out — cierra sesión y redirige a landing.
 *
 * El cliente lo llama vía <form method="POST"> o fetch. No requiere body.
 */
export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  const sb = await getServerClient();
  await sb.auth.signOut();
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
