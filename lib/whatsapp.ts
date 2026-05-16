import { getServerSupabase } from "./supabase";

/**
 * Cliente para WhatsApp Cloud API (Meta Graph).
 *
 * Setup:
 * - WHATSAPP_PHONE_NUMBER_ID: el id del number de tu app (no el número en sí)
 * - WHATSAPP_ACCESS_TOKEN: permanent token de tu Business App
 *
 * Limitación: solo texto libre dentro de la ventana 24h de respuesta del user.
 * Fuera de la ventana → necesitas template aprobada (no implementado en v1).
 */

const GRAPH_API_VERSION = "v22.0";

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

interface MetaResponse {
  messages?: Array<{ id: string }>;
  error?: { message: string; code?: number };
}

/** Convierte 5215512345678 / +52 55 1234 5678 → 5215512345678 (E.164 sin +). */
function normalizePhone(input: string): string {
  return input.replace(/\D+/g, "");
}

/**
 * Envía un texto a un número E.164. Logea siempre en `wa_messages` (incluye fallos).
 */
export async function sendWhatsApp(
  toPhoneE164: string,
  body: string,
  opts: { profileUuid?: string; templateName?: string } = {}
): Promise<WhatsAppSendResult> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return logAndReturn(opts.profileUuid, body, opts.templateName, {
      ok: false,
      error: "missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN",
    });
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizePhone(toPhoneE164),
    type: "text",
    text: { preview_url: false, body },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    const json = (await res.json().catch(() => ({}))) as MetaResponse;

    if (!res.ok || json.error) {
      return logAndReturn(opts.profileUuid, body, opts.templateName, {
        ok: false,
        error: json.error?.message ?? `HTTP ${res.status}`,
      });
    }

    return logAndReturn(opts.profileUuid, body, opts.templateName, {
      ok: true,
      messageId: json.messages?.[0]?.id,
    });
  } catch (err) {
    return logAndReturn(opts.profileUuid, body, opts.templateName, {
      ok: false,
      error: String(err),
    });
  }
}

async function logAndReturn(
  profileUuid: string | undefined,
  body: string,
  templateName: string | undefined,
  result: WhatsAppSendResult
): Promise<WhatsAppSendResult> {
  try {
    const sb = getServerSupabase();
    await sb.from("wa_messages").insert({
      profile_id: profileUuid ?? null,
      direction: "out",
      template_name: templateName ?? null,
      body,
      payload: { messageId: result.messageId, error: result.error },
      status: result.ok ? "sent" : "failed",
    });
  } catch (err) {
    // Logging es best-effort. No queremos romper el feature si la DB falla.
    console.warn("[wa_messages] log failed:", err);
  }
  return result;
}
