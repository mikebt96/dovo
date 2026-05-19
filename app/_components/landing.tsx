import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-svh flex flex-col px-6 py-16 bg-papel text-ink">
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="syne text-6xl lowercase tracking-tight">dovo</h1>
        <p className="syne text-xl lowercase opacity-70 mt-4 text-center max-w-md">
          tratos entre dos.<br />cumplimiento mutuo, accountability simple.
        </p>
        <div className="mt-12 flex gap-4">
          <Link
            href="/sign-up"
            className="bg-ink text-papel px-6 py-3 syne lowercase"
          >
            hacer dúo
          </Link>
          <Link
            href="/sign-in"
            className="border border-ink px-6 py-3 syne lowercase"
          >
            entrar
          </Link>
        </div>
      </div>
      <footer className="mt-16 flex justify-center gap-6 text-xs uppercase tracking-widest opacity-50">
        <Link href="/privacidad" className="hover:opacity-100">
          privacidad
        </Link>
        <Link href="/terminos" className="hover:opacity-100">
          términos
        </Link>
      </footer>
    </main>
  );
}
