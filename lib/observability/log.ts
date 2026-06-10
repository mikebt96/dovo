import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// Logger de errores a core.app_errors (la consola /admin los lista). FIRE-SAFE:
// jamás lanza, jamás afecta el flow que lo invoca. Complementa (no reemplaza) el
// console.error — si la BD está caída, al menos queda el log de Vercel.
export async function logAppError(input: {
  origen: string;
  mensaje: string;
  stack?: string | null;
  url?: string | null;
  userId?: string | null;
}): Promise<void> {
  try {
    const svc = createServiceClient();
    const { error } = await svc.schema("core").from("app_errors").insert({
      origen: input.origen.slice(0, 60),
      mensaje: input.mensaje.slice(0, 500),
      stack: input.stack?.slice(0, 2000) ?? null,
      url: input.url?.slice(0, 300) ?? null,
      user_id: input.userId ?? null,
    });
    if (error) console.error("[logAppError]", error.message);
  } catch (err) {
    console.error("[logAppError]", err instanceof Error ? err.message : err);
  }
}
