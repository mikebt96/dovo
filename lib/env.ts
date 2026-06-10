import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_PULSE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .optional()
    .default("dovo <hola@dovofit.com>"),
  // F7 Pagos · sandbox-first. TODO opcional: sin estas vars el billing queda en "preview"
  // (pricing visible, CTA "próximamente", gates fail-soft). Miguel las pega en Vercel y
  // pone BILLING_ENABLED=true para encender Checkout + cobro real. Ver docs/SETUP_APIS_MIGUEL.md.
  BILLING_ENABLED: z.enum(["true", "false"]).optional().default("false"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_PREMIUM_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PREMIUM_YEARLY: z.string().optional(),
  // F5 Nutrición IA · sandbox-first: sin estas vars el plan es sample determinista.
  // Miguel pega ANTHROPIC_API_KEY + NUTRITION_AI_LIVE=true en Vercel para encender.
  NUTRITION_AI_LIVE: z.enum(["true", "false"]).optional().default("false"),
  ANTHROPIC_API_KEY: z.string().optional(),
  NUTRITION_MODEL: z.string().optional(),
  // F6 Análisis corporal · misma ANTHROPIC_API_KEY; flag aparte para encender por separado.
  BODY_SCAN_LIVE: z.enum(["true", "false"]).optional().default("false"),
  // F8 Push · VAPID self-served (sin cuenta de terceros): genera con scripts/gen-vapid.mjs
  // y pega las 2 keys en Vercel. Sin keys el envío es no-op y la UI muestra "próximamente".
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  // Consola /admin · emails con acceso, separados por coma (default: Miguel — ver lib/admin.ts).
  ADMIN_EMAILS: z.string().optional(),
});

export const publicEnv = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    ...publicEnv,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_PULSE_ROLE_KEY: process.env.SUPABASE_PULSE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  });
}
