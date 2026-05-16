import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  PIN_COOKIE,
  PIN_TTL_SECONDS,
  SLUG_COOKIE,
  verifyPin,
  verifySlug,
} from "@/lib/auth/session";
import { Eyebrow } from "@/app/components/ui";
import { Logo } from "@/app/components/brand";

export const metadata = { title: "acceso" };

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
      <form action={unlock} className="surface w-full max-w-md p-10 space-y-7">
        <header className="space-y-5">
          <div className="flex items-center justify-between">
            <Logo layout="horizontal" size="md" />
            <Eyebrow>
              <span>acceso</span>
            </Eyebrow>
          </div>
          <h1
            className="font-extrabold lowercase tracking-tight leading-[0.88]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.5rem",
              color: "var(--color-text)",
              letterSpacing: "-0.03em",
            }}
          >
            {needPin ? "pin requerido." : "entrar a dovo."}
          </h1>
          <p className="text-sm text-[color:var(--color-text-2)] leading-relaxed">
            {needPin
              ? "Zona reservada con datos sensibles. Marca el PIN."
              : "Escribe el link privado del dúo. Una vez dentro, no necesitarás repetirlo."}
          </p>
        </header>

        {!needPin && (
          <label className="block space-y-2">
            <span className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)]">
              Folio
            </span>
            <input
              type="password"
              name="slug"
              autoComplete="off"
              autoFocus
              className="input-bare input-mono"
            />
          </label>
        )}

        <label className="block space-y-2">
          <span className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)]">
            PIN <span className="lowercase tracking-normal text-[color:var(--color-text-4)]">(6 dígitos · opcional)</span>
          </span>
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            pattern="\d{6}"
            className="input-bare input-mono text-center"
            style={{ fontSize: "1.6rem", letterSpacing: "0.4em" }}
          />
        </label>

        <input type="hidden" name="next" value={next} />

        {error && (
          <p
            className="text-sm mono uppercase tracking-widest"
            style={{ color: "var(--color-danger)" }}
          >
            ✕ folio o pin incorrecto.
          </p>
        )}

        <button type="submit" className="btn-ink w-full justify-center">
          Entrar →
        </button>

        <p className="mono text-[10px] tracking-wider text-[color:var(--color-text-3)] leading-relaxed pt-2 border-t border-[color:var(--color-divider)]">
          Este link es único entre tú y el otro. No lo compartas en chats ni
          redes. El PIN protege fotos, peso y otros datos sensibles.
        </p>
      </form>
    </div>
  );
}
