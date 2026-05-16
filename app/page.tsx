import Link from "next/link";
import {
  BigStat,
  BracketLink,
  Eyebrow,
  HRule,
  RoleDot,
} from "@/app/components/ui";
import { Wordmark } from "@/app/components/brand";
import HeroCoverLazy from "@/app/three/HeroCoverLazy";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col relative">
      <div className="px-6 pt-6 flex items-center justify-between mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
        <Wordmark size="md" />
        <span className="hidden sm:inline">Disciplina compartida</span>
        <span>v1</span>
      </div>

      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-12">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center mb-16">
            <div>
              <Eyebrow className="mb-5">
                <span>Para dos · personal · v1</span>
              </Eyebrow>
              <h1
                className="font-extrabold lowercase tracking-tight leading-[0.85] text-[color:var(--color-text)]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(3.5rem, 11vw, 7.5rem)",
                  letterSpacing: "-0.04em",
                }}
              >
                disciplina,
                <br />
                pero en dúo.
              </h1>
              <p
                className="mt-6 text-[color:var(--color-text-2)] leading-relaxed max-w-md"
                style={{ fontSize: "1.05rem" }}
              >
                Tu plan semanal de comidas y entreno. Las rachas se ganan juntos.
                Los premios son reales — y las consecuencias también.
              </p>
            </div>

            <div className="w-full lg:w-[380px]">
              <HeroCoverLazy />
            </div>
          </div>

          <HRule />

          <div className="mt-12 mb-6 flex items-baseline justify-between">
            <Eyebrow>Entrar como</Eyebrow>
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

          <div className="mt-8 flex items-center gap-6 flex-wrap">
            <BracketLink href="/juntos">Vista compartida →</BracketLink>
            <p className="text-xs text-[color:var(--color-text-3)] flex items-center gap-2">
              <RoleDot who="both" />
              <span>
                Cuando ambos cumplen el mismo día se prende el bono compartido.
              </span>
            </p>
          </div>
        </div>
      </section>

      <footer className="px-6 py-6 mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center">
        dovo · privado · no compartas el link
      </footer>
    </main>
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
        <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)]">
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
