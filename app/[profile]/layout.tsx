import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/profile";
import { folioDate, isoWeek, pad, folioSerial } from "@/lib/dates";

const NAV: Array<{ slug: string; roman: string; label: string }> = [
  { slug: "",          roman: "I",   label: "Hoy" },
  { slug: "super",     roman: "II",  label: "Súper" },
  { slug: "prep",      roman: "III", label: "Prep" },
  { slug: "semana",    roman: "IV",  label: "Semana" },
  { slug: "actividad", roman: "V",   label: "Actividad" },
  { slug: "tienda",      roman: "VI",   label: "Tienda" },
  { slug: "pareja",      roman: "VII",  label: "Pareja" },
  { slug: "preferences", roman: "VIII", label: "Prefs" },
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

  const now = new Date();
  const issue = pad(isoWeek(now), 2);
  const serial = folioSerial(profile.id);
  const accent =
    profile.id === "mike"
      ? "var(--color-plate-mike)"
      : "var(--color-plate-andy)";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Folio band — sticky */}
      <header className="sticky top-0 z-10 bg-[color:var(--color-bg)]/95 backdrop-blur border-b border-[color:var(--color-rule-strong)]">
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)]">
          <span className="flex items-center gap-3">
            <span aria-hidden="true">⊕</span>
            <Link
              href={`/${profile.id}`}
              className="text-[color:var(--color-ink)] font-bold tabular"
            >
              N.º {serial}
            </Link>
            <span className="hidden sm:inline">· {folioDate(now)} · ED. W{issue}</span>
          </span>
          <span className="flex items-center gap-3">
            <span
              className="font-bold tracking-[0.25em]"
              style={{ color: accent }}
            >
              {profile.displayName.toUpperCase()}
            </span>
            <Link
              href="/"
              className="hover:text-[color:var(--color-ink)] transition"
            >
              ↻ cambiar
            </Link>
            <span aria-hidden="true">⊕</span>
          </span>
        </div>

        <nav className="max-w-5xl mx-auto px-4 pb-3 overflow-x-auto">
          <ul className="flex items-baseline gap-5 text-xs whitespace-nowrap">
            {NAV.map((n) => (
              <NavItem
                key={n.slug}
                href={`/${profile.id}${n.slug ? `/${n.slug}` : ""}`}
                roman={n.roman}
                label={n.label}
                accent={accent}
              />
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-[color:var(--color-rule-strong)] py-5 mt-12">
        <p className="mono text-[10px] tracking-widest text-[color:var(--color-ink-dim)] text-center">
          <span aria-hidden="true">⊕</span> IMPRENTA PRIVADA · ED. W{issue} ·
          TIRADA DE DOS <span aria-hidden="true">⊕</span>
        </p>
      </footer>
    </div>
  );
}

function NavItem({
  href,
  roman,
  label,
  accent,
}: {
  href: string;
  roman: string;
  label: string;
  accent: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-baseline gap-1.5 py-2 text-[color:var(--color-ink-mute)] hover:text-[color:var(--color-ink)] transition"
      >
        <span
          className="mono text-[10px] tracking-widest transition-colors group-hover:text-[color:var(--color-overprint)]"
          style={{ color: accent }}
        >
          {roman}
        </span>
        <span
          className="font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}
