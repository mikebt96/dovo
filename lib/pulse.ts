import "server-only";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

export type PulseEventPayload = {
  creator_id: string;
  partner_id: string;
  categoria: string;
  duracion_dias_bucket: string;
  tasa_cumplimiento_bucket: string;
  cohorte_edad?: string;
  cohorte_ciudad?: string;
  es_patrocinado: boolean;
  dow_creacion: number;
};

const FUNCTION_URL = `${publicEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/ingest-pulse-event`;

// sendPulseEvent — await version. Loggea errores pero nunca relanza.
// La edge function tarda típicamente 100-300ms (lookup opt-out + insert).
async function sendPulseEvent(payload: PulseEventPayload): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      console.warn("[pulse] no session token, skipping event");
      return;
    }
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "<no body>");
      console.warn("[pulse] non-ok response:", res.status, text);
    }
  } catch (err) {
    console.warn("[pulse] dispatch threw:", err);
  }
}

// dispatchPulseEvent — fire-and-forget desde server actions.
// Vercel runtime puede terminar antes que resuelva — eventos ocasionales
// se pierden, pero pulse tolera ~1% de pérdida (agregados no transaccionales).
export function dispatchPulseEvent(payload: PulseEventPayload): void {
  sendPulseEvent(payload).catch((err) => {
    console.warn("[pulse] dispatch caught at boundary:", err);
  });
}
