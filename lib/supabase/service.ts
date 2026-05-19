import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { publicEnv } from "@/lib/env";

/**
 * Cliente Supabase con service_role · bypass de RLS.
 *
 * Usar SOLO en server-side flows donde el user no es el actor lógico
 * de la query: token-based lookups, cron handlers, etc.
 *
 * Para queries en nombre del user logueado, usar `createClient()` desde
 * `./server.ts` que respeta RLS via JWT del user.
 */
export function createServiceClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
