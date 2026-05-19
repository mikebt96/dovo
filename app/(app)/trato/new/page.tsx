import Link from "next/link";
import Wizard from "./Wizard";

export const metadata = { title: "hacer un trato · dovo" };

export default function NewTratoPage() {
  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="syne text-4xl lowercase">hacer un trato</h1>
          <p className="text-sm opacity-60 mt-2">
            tres pasos. después se manda al otro.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← volver
        </Link>
      </header>
      <Wizard />
    </main>
  );
}
