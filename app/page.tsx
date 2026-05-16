import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-16 relative overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,241,53,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,157,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative w-full max-w-3xl">
          <p className="mono text-xs text-[var(--color-muted)] mb-4">
            Plan Semanal · Pareja · v1
          </p>
          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span style={{ color: "var(--color-mike)" }}>Mike</span>
            <span className="text-[var(--color-muted)]"> &amp; </span>
            <span style={{ color: "var(--color-andy)" }}>Andy</span>
          </h1>
          <p className="mono text-xs text-[var(--color-muted)] mb-12 max-w-md leading-relaxed">
            Disciplina compartida · Streaks de pareja · Castigos consensuales ·
            Premios reales
          </p>

          {/* Profile picker */}
          <p className="mono text-[10px] text-[var(--color-dim)] mb-3">
            ¿Quién entra?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileCard
              href="/mike"
              name="Mike"
              accent="var(--color-mike)"
              tagline="2400 kcal · 155g proteína · Recomp"
              sports={["Gym", "Caminadora"]}
            />
            <ProfileCard
              href="/andy"
              name="Andy"
              accent="var(--color-andy)"
              tagline="1750 kcal · 115g proteína · Recomp"
              sports={["Gym", "Ballet", "Pilates"]}
            />
          </div>

          <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
            <Link
              href="/juntos"
              className="group flex items-center justify-between p-5 card hover:border-[var(--color-accent)] transition"
            >
              <div>
                <p className="mono text-[10px] text-[var(--color-accent)] mb-1">
                  Vista compartida
                </p>
                <p className="font-extrabold text-lg">
                  Entrar como{" "}
                  <span style={{ color: "var(--color-mike)" }}>Mike</span> +{" "}
                  <span style={{ color: "var(--color-andy)" }}>Andy</span>
                </p>
                <p className="mono text-[10px] text-[var(--color-muted)] mt-1">
                  Streak de pareja · race XP · deudas · plan de hoy
                </p>
              </div>
              <span
                className="mono text-xs group-hover:translate-x-1 transition-transform"
                style={{ color: "var(--color-accent)" }}
              >
                →
              </span>
            </Link>
          </div>

          <p className="mono text-[10px] text-[var(--color-dim)] mt-8">
            Tu sesión se recuerda en este dispositivo. Cambiar de perfil:{" "}
            <Link href="/" className="text-[var(--color-accent)] underline">
              vuelve aquí
            </Link>
            .
          </p>
        </div>
      </section>

      <footer className="px-6 py-6 border-t border-[var(--color-border)]">
        <p className="mono text-[10px] text-[var(--color-dim)] text-center leading-relaxed">
          URL secreta · No compartir · Datos sincronizados entre dispositivos
        </p>
      </footer>
    </main>
  );
}

function ProfileCard({
  href,
  name,
  accent,
  tagline,
  sports,
}: {
  href: string;
  name: string;
  accent: string;
  tagline: string;
  sports: string[];
}) {
  return (
    <Link
      href={href}
      className="group relative card p-8 transition-all hover:border-current"
      style={{ ["--hover-color" as any]: accent }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded"
        style={{ background: accent }}
      />
      <div className="relative">
        <p
          className="mono text-[10px] mb-3"
          style={{ color: accent }}
        >
          Soy
        </p>
        <h2
          className="text-4xl font-extrabold tracking-tight mb-3"
          style={{ color: accent }}
        >
          {name}
        </h2>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-4">
          {tagline}
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {sports.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
        <p
          className="mono text-xs flex items-center gap-2 transition-transform group-hover:translate-x-1"
          style={{ color: accent }}
        >
          Entrar →
        </p>
      </div>
    </Link>
  );
}
