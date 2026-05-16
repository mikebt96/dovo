import Link from "next/link";
import {
  BigStat,
  BracketLink,
  Eyebrow,
  HRule,
  RoleDot,
} from "@/app/components/ui";
import { Logo } from "@/app/components/brand";
import BlobHeroLazy from "@/app/three/BlobHeroLazy";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[color:var(--color-bg)]">
      {/* === HERO FULL-BLEED — blob 3D al fondo === */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Animated Blob Background (z-0) */}
        <BlobHeroLazy />

        {/* Content Overlay (z-10) */}
        <div className="relative z-10 flex min-h-screen flex-col">
          {/* Top minimal nav */}
          <div className="px-6 pt-6 flex items-center justify-between mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
            <Logo layout="horizontal" size="md" />
            <span className="hidden sm:inline">disciplina compartida</span>
            <span>v1</span>
          </div>

          {/* Hero Content centered */}
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="mx-auto max-w-5xl text-center">
              <Eyebrow className="justify-center mb-8">
                <RoleDot who="both" />
                <span>De dos · en uno</span>
              </Eyebrow>

              {/* Main wordmark — sólo "dovo", el blob hace el resto */}
              <h1
                className="font-extrabold lowercase leading-[0.85] tracking-tight text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(6rem, 18vw, 14rem)",
                  letterSpacing: "-0.05em",
                  textShadow: "0 6px 60px rgba(0,0,0,0.7)",
                }}
              >
                dovo
              </h1>

              <p
                className="mt-8 mx-auto max-w-xl text-lg md:text-xl text-white/85 leading-relaxed"
                style={{
                  textShadow: "0 2px 16px rgba(0,0,0,0.7)",
                }}
              >
                No se cumple solo. Se cumple en dúo.
                <br />
                <span className="text-white/60 text-base md:text-lg">
                  Plan semanal de comidas y entreno sincronizado con el otro.
                </span>
              </p>

              {/* CTA buttons */}
              <div className="mt-12 flex items-center justify-center gap-3 flex-wrap">
                <Link href="/mike" className="btn-ink">
                  Entrar como Mike →
                </Link>
                <Link href="/andy" className="btn-ink">
                  Entrar como Andy →
                </Link>
              </div>
              <div className="mt-4 flex items-center justify-center">
                <BracketLink href="/juntos">Vista compartida →</BracketLink>
              </div>
            </div>
          </div>

          {/* === PAIR STATS STRIP — footer del hero === */}
          <PairStatsStrip />
        </div>

        {/* Noise overlay (z-30) — añade textura sutil sobre el blob */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 opacity-[0.04]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\"/%3E%3C/svg%3E')",
          }}
        />
      </section>

      {/* === SECTION SECUNDARIA — selector detallado === */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-6 py-16">
        <div className="mb-6 flex items-baseline justify-between">
          <Eyebrow>O entra a tu plan</Eyebrow>
          <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)]">
            tu sesión queda en este dispositivo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[color:var(--color-divider-strong)]">
          <ProfileEntry
            href="/mike"
            who="mike"
            name="Mike"
            kcal={2400}
            protein={155}
            disciplines={["Gym", "Caminadora"]}
          />
          <ProfileEntry
            href="/andy"
            who="andy"
            name="Andy"
            kcal={1750}
            protein={115}
            disciplines={["Gym", "Ballet", "Pilates"]}
          />
        </div>
      </section>

      <footer className="relative z-10 px-6 py-6 mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center">
        dovo · privado · no compartas el link
      </footer>
    </main>
  );
}

/**
 * PairStatsStrip — footer del hero. Glass surface con 3 columnas:
 *   · Mike (role-dot cyan, avatar gradient, status)
 *   · Pair streak grande lima al centro
 *   · Andy (mirror)
 */
function PairStatsStrip() {
  return (
    <div className="relative z-20 border-t border-white/10 bg-[color:var(--color-bg)]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-6 py-7 md:py-8">
        <div className="flex items-center justify-between gap-4">
          {/* Mike */}
          <ProfileAvatar who="mike" name="Mike" status="activo" />

          {/* Shared streak */}
          <div className="flex flex-col items-center text-center">
            <p
              className="font-extrabold tabular leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 6vw, 3.5rem)",
                color: "var(--color-accent)",
                letterSpacing: "-0.04em",
              }}
            >
              0
            </p>
            <p className="mono text-[10px] tracking-widest uppercase text-white/55 mt-1">
              días seguidos
            </p>
          </div>

          {/* Andy mirror */}
          <ProfileAvatar who="andy" name="Andy" status="activo" mirror />
        </div>
      </div>
    </div>
  );
}

function ProfileAvatar({
  who,
  name,
  status,
  mirror = false,
}: {
  who: "mike" | "andy";
  name: string;
  status: string;
  mirror?: boolean;
}) {
  const isMike = who === "mike";
  const accentHex = isMike ? "#6bf5ff" : "#ff6b9d";

  const avatar = (
    <div className="relative flex-shrink-0">
      <div
        className="h-12 w-12 md:h-14 md:w-14 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${accentHex} 0%, ${accentHex}55 100%)`,
        }}
      />
      <div
        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2"
        style={{
          background: accentHex,
          borderColor: "var(--color-bg)",
        }}
      />
    </div>
  );

  const label = (
    <div className={mirror ? "text-right" : "text-left"}>
      <p className="text-sm font-semibold text-white lowercase tracking-tight">
        {name.toLowerCase()}
      </p>
      <p className="text-xs text-white/55 mono tracking-widest uppercase">
        {status}
      </p>
    </div>
  );

  return (
    <Link
      href={`/${who}`}
      className="flex items-center gap-3 md:gap-4 hover:opacity-90 transition"
    >
      {mirror ? (
        <>
          {label}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {label}
        </>
      )}
    </Link>
  );
}

function ProfileEntry({
  href,
  who,
  name,
  kcal,
  protein,
  disciplines,
}: {
  href: string;
  who: "mike" | "andy";
  name: string;
  kcal: number;
  protein: number;
  disciplines: string[];
}) {
  const accent =
    who === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";
  return (
    <Link
      href={href}
      className="group relative block py-10 px-2 md:px-6 border-b md:border-b-0 md:border-r md:last:border-r-0 border-[color:var(--color-divider-strong)] transition-colors hover:bg-[color:var(--color-surface-1)]"
    >
      <div className="flex items-center justify-between mb-5">
        <Eyebrow>
          <RoleDot who={who} />
          <span style={{ color: accent }}>Soy {name.toLowerCase()}</span>
        </Eyebrow>
        <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] tabular">
          {disciplines.length} disciplinas
        </span>
      </div>

      <p
        className="font-extrabold lowercase tracking-tight leading-[0.82] mb-8 transition-transform group-hover:translate-x-1"
        style={{
          color: accent,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(3rem, 7vw, 4.5rem)",
          letterSpacing: "-0.04em",
        }}
      >
        {name.toLowerCase()}
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        <BigStat label="Kcal" value={kcal.toLocaleString("en-US")} />
        <BigStat label="Proteína" value={protein} unit="g" />
      </div>

      <p
        className="mt-8 mono text-[11px] tracking-[0.22em] uppercase flex items-center gap-2 transition-colors group-hover:text-[color:var(--color-accent)]"
        style={{ color: accent }}
      >
        Entrar
        <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}
