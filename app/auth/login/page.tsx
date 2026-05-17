import { redirect } from "next/navigation";
import { Logo } from "@/app/components/brand";
import { Eyebrow } from "@/app/components/ui";
import { getSessionUser } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const metadata = { title: "entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const { next = "/match", sent, error } = await searchParams;

  // Si ya está autenticado, no tiene sentido mostrar login → redirige.
  const user = await getSessionUser();
  if (user) redirect(next.startsWith("/") ? next : "/match");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="surface w-full max-w-md p-10 space-y-7">
        <header className="space-y-5">
          <div className="flex items-center justify-between">
            <Logo layout="horizontal" size="md" />
            <Eyebrow>
              <span>entrar</span>
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
            {sent ? "checa tu correo." : "tu correo."}
          </h1>
          <p className="text-sm text-[color:var(--color-text-2)] leading-relaxed">
            {sent
              ? "Te mandamos un link. Ábrelo desde el mismo dispositivo donde quieres entrar."
              : "Te mando un link mágico. Lo abres, entras. Sin contraseñas."}
          </p>
        </header>

        {!sent && <LoginForm next={next} initialError={error} />}

        <p className="mono text-[10px] tracking-wider text-[color:var(--color-text-3)] leading-relaxed pt-2 border-t border-[color:var(--color-divider)]">
          Tu correo solo lo usamos para mandarte el link. Sin newsletters, sin
          marketing.
        </p>
      </div>
    </main>
  );
}
