import "server-only";
import { Resend } from "resend";

type SendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true }
  | { ok: false; error: string };

let cached: Resend | null = null;

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

function from(): string {
  return process.env.RESEND_FROM_EMAIL ?? "dovo <hola@dovo.app>";
}

// Fail-soft: si RESEND_API_KEY no está seteada, log warning y skip.
// Si está, envía y captura errores. Nunca lanza — los callers usan
// fire-and-forget para no bloquear server actions.
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY no configurada — email omitido:",
      opts.subject,
    );
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: from(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: "hola@dovo.app",
    });
    if (error) {
      console.error("[email] resend error:", error);
      return { ok: false, error: String(error.message ?? error) };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] send threw:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Helper para fire-and-forget desde server actions: no await, no truena.
export function dispatchEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): void {
  sendEmail(opts).catch((err) => {
    console.error("[email] dispatch failed:", err);
  });
}
