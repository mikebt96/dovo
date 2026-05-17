import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6 py-16 bg-papel text-ink">
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
    </main>
  );
}
