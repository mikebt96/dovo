import Link from "next/link";
import LanguageToggle from "@/app/_components/LanguageToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-svh flex flex-col items-center justify-center px-6 py-16 bg-papel text-ink">
      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>
      <Link href="/" className="syne text-4xl font-extrabold tracking-tight mb-12">
        dovo
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
