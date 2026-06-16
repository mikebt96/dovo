"use server";

import type { Result } from "@/lib/actions/result";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAppError } from "@/lib/observability/log";

// F26 · Cancelar cuenta (aviso v1.0 §13). El RPC borra todo lo borrable de
// inmediato y deja la fila users como tombstone anonimizado (los FKs RESTRICT
// de tratos/retos/apuestas impiden el hard-delete). Después se banea el login
// en auth y se anonimiza el email de auth — la cuenta deja de existir para
// efectos prácticos en el mismo instante.
export async function cancelarCuenta(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const { error: rpcErr } = await supabase.schema("core").rpc("cancelar_cuenta");
  if (rpcErr) {
    console.error("[cuenta] cancelar:", rpcErr.message);
    return { ok: false, error: "no se pudo cancelar — intenta de nuevo" };
  }

  // Baneo + tombstone en auth. Si fallara, el dato ya se borró (lo
  // importante); se loguea para barrido manual — jamás se le miente al
  // usuario diciendo que falló la cancelación.
  try {
    const svc = createServiceClient();
    const { error: banErr } = await svc.auth.admin.updateUserById(user.id, {
      email: `cancelada+${user.id.slice(0, 8)}@dovofit.com`,
      email_confirm: true,
      ban_duration: "876000h", // ~100 años
    });
    if (banErr) {
      await logAppError({
        origen: "cancelar-cuenta",
        mensaje: `ban/anonimizado de auth falló: ${banErr.message}`,
        userId: user.id,
      });
    }
  } catch (e) {
    await logAppError({
      origen: "cancelar-cuenta",
      mensaje: `ban/anonimizado de auth lanzó: ${e instanceof Error ? e.message : String(e)}`,
      userId: user.id,
    });
  }

  await supabase.auth.signOut();
  return { ok: true, data: undefined };
}
