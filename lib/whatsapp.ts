import { getServerSupabase } from "./supabase";

/**
 * WhatsApp transport vía CallMeBot.
 *
 * CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/) es un
 * servicio gratuito que permite enviar mensajes a TU propio número personal
 * de WhatsApp vía un GET HTTP simple. NO requiere Meta Business, NO requiere
 * plantillas aprobadas, NO tiene ventana 24h.
 *
 * SETUP (one-time por cada user que quiera recibir avisos):
 * 1. Agregar contacto: +34 644 51 65 76 (CallMeBot)
 * 2. Mandar el mensaje: "I allow callmebot to send me messages"
 * 3. CallMeBot responde con un `apikey` numérico (~6-8 dígitos)
 * 4. Guardar ese apikey en profiles.callmebot_api_key
 *
 * Trade-off: solo a tu propio número. Para notificar al partner, cada user
 * mantiene su propia api_key — perfecto para Mike/Andy (2 destinatarios fijos).
 *
 * Rate limit: ~10 mensajes/minuto por número. Suficiente para re-plans.
 */

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;          // CallMeBot no devuelve id; mantenemos campo para compat
  error?: string;
}

const CALLMEBOT_BASE = "https://api.callmebot.com/whatsapp.php";

/** Convierte +52 55 1234 5678 → 5215512345678 (sin '+', solo dígitos). */
function normalizePhone(input: string): string {
  return input.replace(/\D+/g, "");
}

export interface SendOpts {
  profileUuid?: string;
  templateName?: string;
  /**
   * API key específica del número destino. CallMeBot la emite por usuario.
   * REQUERIDA — sin esto el envío falla con HTTP 400.
   */
  apiKey?: string;
}

/**
 * Envía un texto al número E.164 indicado. Logea siempre en `wa_messages`.
 * Si falta apiKey o credenciales, registra el error y devuelve `ok:false`
 * sin lanzar — el caller debe decidir si propagar al user o silenciar.
 */
export async function sendWhatsApp(
  toPhoneE164: string,
  body: string,
  opts: SendOpts = {}
): Promise<WhatsAppSendResult> {
  if (!opts.apiKey) {
    return logAndReturn(opts.profileUuid, body, opts.templateName, {
      ok: false,
      error: "missing callmebot_api_key for this profile",
    });
  }

  const phone = normalizePhone(toPhoneE164);
  if (!phone) {
    return logAndReturn(opts.profileUuid, body, opts.templateName, {
      ok: false,
      error: "invalid phone",
    });
  }

  const params = new URLSearchParams({
    phone,
    text: body,
    apikey: opts.apiKey,
  });
  const url = `${CALLMEBOT_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });

    // CallMeBot devuelve text/html. Status 200 + body con "Message queued"
    // o "Message Sent" → éxito. Otros patterns → error.
    const text = await res.text().catch(() => "");
    const success =
      res.ok &&
      /queued|sent|enviado/i.test(text) &&
      !/error|invalid|wrong/i.test(text);

    if (!success) {
      return logAndReturn(opts.profileUuid, body, opts.templateName, {
        ok: false,
        error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      });
    }
    return logAndReturn(opts.profileUuid, body, opts.templateName, { ok: true });
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
      payload: { provider: "callmebot", error: result.error },
      status: result.ok ? "sent" : "failed",
    });
  } catch (err) {
    console.warn("[wa_messages] log failed:", err);
  }
  return result;
}
