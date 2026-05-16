import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-10 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/${profile.id}`}
            className="flex items-center gap-3"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: profile.color }}
            />
            <span
              className="font-extrabold tracking-tight"
              style={{ color: profile.color }}
            >
              {profile.displayName}
            </span>
          </Link>
          <Link
            href="/"
            className="mono text-[10px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition"
          >
            cambiar perfil
          </Link>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-2 overflow-x-auto">
          <ul className="flex gap-1 text-xs">
            <NavLink href={`/${profile.id}`} label="Hoy" />
            <NavLink href={`/${profile.id}/super`} label="Súper" />
            <NavLink href={`/${profile.id}/prep`} label="Prep dom" />
            <NavLink href={`/${profile.id}/semana`} label="Semana" />
            <NavLink href={`/${profile.id}/tienda`} label="Tienda" />
            <NavLink href={`/${profile.id}/pareja`} label="Pareja" />
          </ul>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-[var(--color-border)] py-4">
        <p className="mono text-[10px] text-[var(--color-dim)] text-center">
          {profile.displayName} · v1 · personal
        </p>
      </footer>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="mono uppercase tracking-wider text-[10px] px-3 py-2 inline-block text-[var(--color-muted)] hover:text-[var(--color-accent)] transition"
      >
        {label}
      </Link>
    </li>
  );
}
