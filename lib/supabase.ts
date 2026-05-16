import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

/**
 * Server-side Supabase client con service_role.
 *
 * - `import "server-only"` garantiza que este módulo NUNCA se incluye en
 *   un bundle de cliente (incluso por error). Si algún component "use client"
 *   lo importa, Next falla la build.
 * - Singleton en memoria por proceso: no creamos un nuevo cliente por request.
 * - `getEnv()` ya valida las env vars contra Zod, así que no duplicamos checks.
 *
 * Para tipos full sobre las tablas: `npx supabase gen types typescript
 *   --project-id <ID> --schema public > lib/db-types.ts` y reemplazar
 *   `SupabaseClient` por `SupabaseClient<Database>`.
 */
let _client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (_client) return _client;
  const env = getEnv();
  _client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return _client;
}
