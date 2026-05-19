import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh max-w-3xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between border-b border-ink pb-6">
        <Link href="/" className="syne text-3xl lowercase tracking-tight">
          dovo
        </Link>
        <nav className="flex gap-4 text-xs uppercase tracking-widest opacity-60">
          <Link href="/privacidad" className="hover:opacity-100">
            privacidad
          </Link>
          <Link href="/terminos" className="hover:opacity-100">
            términos
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
