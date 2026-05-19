import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PulseOptOutToggle from "./_components/PulseOptOutToggle";
import SignOutButton from "./_components/SignOutButton";

export const metadata = { title: "ajustes · dovo" };
export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: meRow } = await supabase
    .schema("core")
    .from("users")
    .select("nombre, email, pulse_opt_out")
    .eq("id", user.id)
    .maybeSingle();

  const optOut = (meRow?.pulse_opt_out as boolean | undefined) ?? false;

  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
            ajustes
          </p>
          <h1 className="syne text-3xl lowercase">tu cuenta</h1>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← inicio
        </Link>
      </header>

      <section className="border-t border-b border-ink py-8 mb-10 space-y-4">
        <Row label="Nombre" value={meRow?.nombre ?? "sin nombre"} />
        <Row label="Email" value={meRow?.email ?? user.email ?? ""} />
      </section>

      <section className="mb-10">
        <h2 className="syne text-xl lowercase mb-5">pulse</h2>
        <PulseOptOutToggle initial={optOut} />
      </section>

      <section className="mb-10">
        <h2 className="syne text-xl lowercase mb-5">feedback</h2>
        <a
          href="mailto:miguel.butron06@gmail.com?subject=feedback%20dovo"
          className="text-sm underline opacity-80 hover:opacity-100"
        >
          escríbele al equipo →
        </a>
      </section>

      <section className="mb-10">
        <h2 className="syne text-xl lowercase mb-5">legal</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/privacidad" className="underline opacity-80 hover:opacity-100">
            aviso de privacidad →
          </Link>
          <Link href="/terminos" className="underline opacity-80 hover:opacity-100">
            términos de servicio →
          </Link>
        </nav>
      </section>

      <section className="pt-8 border-t border-ink">
        <SignOutButton />
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest opacity-60">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
