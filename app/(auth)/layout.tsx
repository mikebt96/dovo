import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6 py-16 bg-papel">
      <Link href="/" className="syne text-4xl font-extrabold tracking-tight mb-12">
        dovo
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
