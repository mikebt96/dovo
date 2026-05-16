import "server-only";
import { z } from "zod";

/**
 * Validación de env vars al import time.
 * Si falta una variable crítica, el server NO arranca — preferible a
 * descubrir el problema en runtime al primer query.
 *
 * `import 'server-only'` garantiza que este módulo NUNCA se incluye en
 * el bundle del cliente (incluso si por accidente algún componente lo importa).
 */

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  ANTHROPIC_API_KEY: z.string().min(20).optional(),

  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),

  CRON_SECRET: z.string().min(16).optional(),
  SECRET_LINK_SLUG: z.string().min(8),
  APP_PIN: z.string().regex(/^\d{6}$/, "APP_PIN debe ser 6 dígitos").optional(),
});

type Env = z.infer<typeof EnvSchema>;

let _cached: Env | null = null;

/**
 * Lazy getter — la validación solo corre cuando un módulo server-only
 * realmente pide env. Esto permite que rutas estáticas (sin Supabase)
 * sigan funcionando sin .env.local en local dev.
 */
export function getEnv(): Env {
  if (_cached) return _cached;
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error("❌ Env inválido:\n" + issues);
    throw new Error("Env vars inválidas — revisa .env.local contra .env.example");
  }
  _cached = result.data;
  return _cached;
}
