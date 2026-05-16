import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  PIN_COOKIE,
  PIN_TTL_SECONDS,
  SLUG_COOKIE,
  verifyPin,
  verifySlug,
} from "@/lib/auth/session";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

async function unlock(formData: FormData): Promise<void> {
  "use server";

  const slug = String(formData.get("slug") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const next = String(formData.get("next") ?? "/");

  const jar = await cookies();

  if (slug && verifySlug(slug)) {
    jar.set(SLUG_COOKIE, "ok", COOKIE_OPTS);
  }

  if (pin && verifyPin(pin)) {
    jar.set(PIN_COOKIE, "ok", { ...COOKIE_OPTS, maxAge: PIN_TTL_SECONDS });
  }

  // Redirect a la ruta original si la sesión quedó válida; si no, recargar /unlock.
  const slugOk = (jar.get(SLUG_COOKIE)?.value ?? "") === "ok";
  if (slugOk) redirect(next.startsWith("/") ? next : "/");
  redirect("/unlock?error=1");
}

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string; error?: string }>;
}) {
  const { next = "/", reason, error } = await searchParams;
  const needPin = reason === "pin";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <form
        action={unlock}
        className="ticket-flat w-full max-w-md p-8 space-y-6"
      >
        <header className="space-y-2">
          <p className="mono text-[10px] text-[color:var(--color-ink-mute)]">
            Carnet · Acceso
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}>
            {needPin ? "PIN requerido" : "Folio de entrada"}
          </h1>
          <p className="text-sm text-[color:var(--color-ink-soft)] leading-relaxed">
            {needPin
              ? "Estás entrando a una zona reservada (datos sensibles). Marca el PIN."
              : "Escribe el folio de la pareja. Una vez dentro, no necesitarás repetirlo."}
          </p>
        </header>

        {!needPin && (
          <label className="block space-y-1">
            <span className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-ink-mute)]">
              Folio
            </span>
            <input
              type="password"
              name="slug"
              autoComplete="off"
              autoFocus
              className="w-full bg-[color:var(--color-paper-2)] border border-[color:var(--color-rule-strong)] px-3 py-2 font-mono tracking-wider focus:outline-none focus:border-[color:var(--color-ink)] text-[color:var(--color-ink)]"
            />
          </label>
        )}

        <label className="block space-y-1">
          <span className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-ink-mute)]">
            PIN <span className="lowercase tracking-normal">(6 dígitos · opcional para entrar)</span>
          </span>
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            pattern="\d{6}"
            className="w-full bg-[color:var(--color-paper-2)] border border-[color:var(--color-rule-strong)] px-3 py-2 font-mono text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-[color:var(--color-ink)] text-[color:var(--color-ink)]"
          />
        </label>

        <input type="hidden" name="next" value={next} />

        {error && (
          <p className="text-sm text-[color:var(--color-overdue)] mono">
            ❌ Folio o PIN incorrecto.
          </p>
        )}

        <button type="submit" className="btn-ink w-full justify-center">
          Entrar
        </button>

        <p className="marginalia">
          <span className="tag">Aviso</span>
          Este folio es único entre tú y tu pareja. No lo compartas en chats ni redes.
          El PIN protege fotos, peso y otros datos sensibles.
        </p>
      </form>
    </div>
  );
}
