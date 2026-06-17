"use server";

import type { Result } from "@/lib/actions/result";

import { createClient } from "@/lib/supabase/server";

// F26/F30 · Cancelar cuenta (aviso v1.0 §13 + compliance App Store/Play). El RPC
// core.cancelar_cuenta() hace TODO el borrado en una transacción: purga los
// datos de core, deja la fila users como tombstone anonimizado (los FK RESTRICT
// de tratos/apuestas impiden el hard-delete) Y purga auth — ofusca email/phone/
// metadata, borra identities (incl. Google) y revoca TODAS las sesiones. La
// cuenta deja de existir, no solo se "desactiva" (lo que Apple 5.1.1/v rechaza).
// El signOut final solo limpia el estado del cliente (la sesión ya murió en el server).
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

  await supabase.auth.signOut();
  return { ok: true, data: undefined };
}
