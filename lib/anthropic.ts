import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Cliente Claude con init PEREZOSO (mismo patrón que lib/stripe.ts): sin ANTHROPIC_API_KEY
// devuelve null y nada truena (sandbox-first). La key vive solo server-side.
let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!_client) _client = new Anthropic({ apiKey: key });
  return _client;
}

/** Flag maestro de F5: la IA solo corre con flag explícito Y key presente. */
export function isNutritionAiLive(): boolean {
  return process.env.NUTRITION_AI_LIVE === "true" && !!process.env.ANTHROPIC_API_KEY;
}

// Modelo configurable por env (default: el más capaz). Miguel puede bajar a
// claude-haiku-4-5 para reducir COGS sin tocar código (ver docs/SETUP_APIS_MIGUEL.md).
export const NUTRITION_MODEL = process.env.NUTRITION_MODEL ?? "claude-opus-4-6";
