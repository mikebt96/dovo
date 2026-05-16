import Link from "next/link";
import {
  BigStat,
  BracketLink,
  Eyebrow,
  HRule,
  RoleDot,
} from "@/app/components/ui";
import { Logo } from "@/app/components/brand";
import IridescentOrbLazy from "@/app/three/IridescentOrbLazy";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Top minimal nav */}
      <div className="px-6 pt-6 flex items-center justify-between mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
        <Logo layout="horizontal" size="md" />
        <span className="hidden sm:inline">disciplina compartida</span>
        <span>v1</span>
      </div>

      {/* === HERO PRINCIPAL — IridescentOrb + pair-stats strip === */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-10">
        {/* Soft radial behind orb — lifts the surface */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/3 -z-10 mx-auto h-[520px] max-w-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(200,241,53,0.10) 0%, rgba(107,245,255,0.08) 35%, rgba(255,107,157,0.06) 60%, transparent 80%)",
            filter: "blur(40px)",
          }}
        />

        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center mb-14">
            <div>
              <Eyebrow className="mb-5">
                <span className="flex items-center gap-1.5">
                  <RoleDot who="both" />
                  <span>Disciplina · de dos · en uno</span>
                </span>
              </Eyebrow>
              <h1
                className="font-extrabold lowercase tracking-tight leading-[0.82] text-[color:var(--color-text)]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(3.5rem, 11vw, 7.5rem)",
                  letterSpacing: "-0.045em",
                }}
              >
                no se cumple
                <br />
                solo. se cumple
                <br />
                <span style={{ color: "var(--color-accent)" }}>en dúo.</span>
              </h1>
              <p
                className="mt-7 text-[color:var(--color-text-2)] leading-relaxed max-w-md"
                style={{ fontSize: "1.05rem" }}
              >
                Tu plan semanal de comidas y entreno, sincronizado con tu pareja.
                Las rachas se ganan juntos. Los premios son reales — y las
                consecuencias también.
              </p>

              <div className="mt-8 flex items-center gap-3 flex-wrap">
                <BracketLink href="/mike">Entrar como Mike →</BracketLink>
                <BracketLink href="/andy">Entrar como Andy →</BracketLink>
                <BracketLink href="/juntos">Vista compartida →</BracketLink>
              </div>
            </div>

            {/* === ORBE IRIDISCENTE — el centro visual === */}
            <div className="w-full lg:w-[440px] mx-auto">
              <IridescentOrbLazy height="440px" size={1.55} />
            </div>
          </div>

          {/* === PAIR-STATS STRIP === */}
          <PairStatsStrip />

          <HRule />

          {/* === PROFILES SELECTOR — segunda lectura, no la principal === */}
          <div className="mt-12 mb-6 flex items-baseline justify-between">
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
        </div>
      </section>

      <footer className="px-6 py-6 mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center">
        dovo · privado · no compartas el link
      </footer>
    </main>
  );
}

/**
 * Pair-stats strip — surface premium con 3 columnas:
 *  · perfil Mike (role-dot + nombre + macros)
 *  · streak compartido (centro, lima)
 *  · perfil Andy (mirror)
 *
 * Va justo debajo del orbe; lectura inmediata de "esta app es para dos".
 */
function PairStatsStrip() {
  return (
    <section className="surface relative px-6 py-7 md:py-8 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 items-center">
      <ProfileMini who="mike" name="Mike" kcal={2400} protein={155} />

      <div className="flex flex-col items-center text-center px-4">
        <Eyebrow className="mb-2">
          <RoleDot who="both" />
          <span>Pair streak</span>
        </Eyebrow>
        <p
          className="font-extrabold tabular tracking-tight leading-none"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 7vw, 4.5rem)",
            color: "var(--color-accent)",
            letterSpacing: "-0.04em",
          }}
        >
          0
        </p>
        <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] mt-1.5">
          días seguidos · empieza hoy
        </p>
      </div>

      <ProfileMini who="andy" name="Andy" kcal={1750} protein={115} mirror />
    </section>
  );
}

function ProfileMini({
  who,
  name,
  kcal,
  protein,
  mirror = false,
}: {
  who: "mike" | "andy";
  name: string;
  kcal: number;
  protein: number;
  mirror?: boolean;
}) {
  const accent =
    who === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";
  return (
    <Link
      href={`/${who}`}
      className={`group flex items-baseline gap-4 ${
        mirror ? "md:justify-end" : ""
      }`}
    >
      <div className={mirror ? "text-right order-2" : ""}>
        <Eyebrow className={mirror ? "justify-end" : ""}>
          <RoleDot who={who} />
          <span style={{ color: accent }}>{name.toLowerCase()}</span>
        </Eyebrow>
        <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)] mt-2 tabular">
          {kcal.toLocaleString("en-US")} kcal · {protein}g P
        </p>
      </div>
      <p
        className={`font-extrabold lowercase tracking-tight leading-none transition-transform ${
          mirror
            ? "order-1 group-hover:-translate-x-1"
            : "group-hover:translate-x-1"
        }`}
        style={{
          color: accent,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "-0.04em",
        }}
      >
        {name.toLowerCase()}
      </p>
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
