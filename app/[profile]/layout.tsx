import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { GlassBar, RoleDot } from "@/app/components/ui";
import { Wordmark } from "@/app/components/brand";

const NAV: Array<{ slug: string; label: string }> = [
  { slug: "",            label: "Hoy" },
  { slug: "semana",      label: "Semana" },
  { slug: "super",       label: "Compras" },
  { slug: "prep",        label: "Domingo" },
  { slug: "actividad",   label: "Actividad" },
  { slug: "tienda",      label: "Recompensas" },
  { slug: "duo",         label: "Dúo" },
  { slug: "foto",        label: "Fotos · 🔒" },
  { slug: "preferences", label: "Ajustes" },
];

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

  const accent =
    profile.id === "mike"
      ? "var(--color-role-mike)"
      : "var(--color-role-andy)";

  return (
    <div className="min-h-screen flex flex-col">
      <GlassBar>
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <Link
            href={`/${profile.id}`}
            className="flex items-center gap-2.5"
            aria-label="dovo · inicio del perfil"
          >
            <RoleDot who={profile.id} />
            <Wordmark size="md" />
            <span
              className="hidden sm:inline mono text-[10px] tracking-widest"
              style={{ color: accent }}
            >
              · {profile.displayName}
            </span>
          </Link>

          <div className="flex items-center gap-4 mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
            <Link
              href="/juntos"
              className="hidden sm:inline hover:text-[color:var(--color-text)] transition"
            >
              juntos
            </Link>
            <Link
              href="/"
              className="hover:text-[color:var(--color-text)] transition"
            >
              cambiar
            </Link>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-5 pb-3 overflow-x-auto">
          <ul className="flex items-baseline gap-1 text-xs">
            {NAV.map((n) => (
              <NavItem
                key={n.slug}
                href={`/${profile.id}${n.slug ? `/${n.slug}` : ""}`}
                label={n.label}
                accent={accent}
              />
            ))}
          </ul>
        </nav>
      </GlassBar>

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-8 relative z-[1]">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  label,
  accent,
}: {
  href: string;
  label: string;
  accent: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-baseline gap-1.5 px-3 py-2 mono text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)] transition"
      >
        <span
          aria-hidden="true"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: accent }}
        >
          ·
        </span>
        {label}
      </Link>
    </li>
  );
}
