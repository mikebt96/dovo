import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_PULSE_ROLE_KEY: z.string().min(1),
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
  });
}
