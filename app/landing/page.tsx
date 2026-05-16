import type { Metadata } from "next";
import { Logo, Mark, Wordmark } from "@/app/components/brand";
import { Eyebrow } from "@/app/components/ui";
import WaitlistForm from "./WaitlistForm";

/**
 * Landing pública dovo · ruta /landing
 *
 * Estructura (de arriba a abajo):
 *   1. Hero — wordmark gigante + tagline ancla + sub + CTA
 *   2. Mecánica — 3 pasos editorial
 *   3. Para quién — lista canon del BRAND.md (incluye rivales)
 *   4. Diferencial — el ángulo "aunque se odien"
 *   5. Pricing — primeros 200 gratis · $99 MXN/mes después
 *   6. Waitlist form
 *   7. Footer minimal
 *
 * Decisiones de diseño:
 *   - Server Component: no hay state, todo el motion intencional vive
 *     dentro de <WaitlistForm /> (client). Esto mantiene el JS bundle
 *     mínimo para SEO/share.
 *   - Cero 3D — la tipografía Syne hace el trabajo editorial. Consistente
 *     con README v1 ("Sin 3D en v1").
 *   - Idioma estricto ES-MX coloquial. Vocabulario auditado contra
 *     BRAND.md → tabla canon (trato/reto/apuesta · NO pacto/alianza).
 */

export const metadata: Metadata = {
  title: "dovo · lo prometido es deuda",
  description:
    "Un trato para dos. Llevan racha juntos. Si rompes, le debes algo al otro. Si los dos cumplen, ganan premios reales. Para parejas, amigos, hermanos, rivales.",
  openGraph: {
    title: "dovo · lo prometido es deuda",
    description: "Un trato para dos. Cuesta romperlo.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <TopBar />
      <Hero />
      <Mecanica />
      <ParaQuien />
      <Diferencial />
      <Pricing />
      <WaitlistSection />
      <Footer />
    </main>
  );
}

/* ============================================================ */

function TopBar() {
  return (
    <header className="px-6 md:px-10 pt-6 flex items-center justify-between mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)]">
      <Logo layout="horizontal" size="md" />
      <span className="hidden sm:inline">disciplina compartida</span>
    </header>
  );
}

/* ============================================================ */
/*  HERO                                                         */
/*  TODO_HERO_COPY ↓ — Miguel: elige headline + subline          */
/* ============================================================ */

function Hero() {
  /*
   * TODO_HERO_COPY — DECIDIR ANTES DE PUBLICAR
   *
   * El headline es la decisión editorial más importante de la landing.
   * Opciones del BRAND.md (todas aprobadas como tagline):
   *
   *   A) "lo prometido es deuda."        ← anchor oficial · más universal
   *   B) "hicimos un trato. cuesta       ← más narrativo · pareja first
   *       romperlo."
   *   C) "el trato que funciona          ← polarizador · rivalry first
   *       aunque se odien."
   *   D) "tu palabra contra la suya."    ← más duelo · ambiguo
   *
   * Default actual: A (universal, brand anchor, cabe en 1 línea grande).
   *
   * Subline también editable (línea de abajo).
   * Cuando elijas, borra este bloque y ajusta el <h1> + <p>.
   */
  return (
    <section className="px-6 md:px-10 pt-20 md:pt-28 pb-20 md:pb-32">
      <div className="max-w-5xl">
        <Eyebrow className="mb-8">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />
          <span>commitment device · para dos</span>
        </Eyebrow>

        <h1
          className="lowercase font-extrabold leading-[0.86] tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.2rem, 11vw, 9rem)",
            letterSpacing: "-0.05em",
          }}
        >
          lo prometido<br />es deuda.
        </h1>

        <p
          className="mt-10 max-w-2xl text-xl md:text-2xl leading-relaxed text-[color:var(--color-text-2)]"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
        >
          Hacen un trato. Llevan racha. Si rompes, le debes algo al otro —
          del catálogo que ustedes mismos firmaron. Si los dos cumplen,
          se desbloquea un premio real.
        </p>

        <p className="mt-6 max-w-2xl text-base text-[color:var(--color-text-3)]">
          Funciona para parejas, amigos, hermanos, roommates, rivales.
          El único requisito es que sean dos y se digan en serio.
        </p>

        <div className="mt-12 flex items-center gap-6 flex-wrap">
          <a href="#waitlist" className="btn-ink">
            Apartar lugar →
          </a>
          <a
            href="#mecanica"
            className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            cómo funciona ↓
          </a>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/*  MECÁNICA — 3 pasos                                           */
/* ============================================================ */

function Mecanica() {
  const pasos = [
    {
      n: "01",
      titulo: "firman el trato",
      cuerpo:
        "Eligen la rutina (gym, ballet, lectura, no fumar — lo que sea) y los castigos del catálogo. Ambos aceptan. No hay vuelta atrás sin pagar.",
    },
    {
      n: "02",
      titulo: "llevan racha",
      cuerpo:
        "Cada día cumplido cuenta. La app marca quién cumplió y quién no. Sin discusión: lo prometido o se cumple o se rompe.",
    },
    {
      n: "03",
      titulo: "alguien paga",
      cuerpo:
        "Si rompes la racha, le debes al otro lo que pactaron. Si los dos cumplen al final del ciclo, se desbloquea el premio. Skin in the game, simétrico.",
    },
  ];

  return (
    <section
      id="mecanica"
      className="border-t border-[color:var(--color-divider-strong)] px-6 md:px-10 py-20 md:py-28"
    >
      <div className="max-w-6xl">
        <Eyebrow className="mb-6">cómo funciona</Eyebrow>
        <h2
          className="lowercase font-bold leading-[0.92] tracking-tight max-w-3xl"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
            letterSpacing: "-0.04em",
          }}
        >
          tres pasos.<br />uno los amarra a los dos.
        </h2>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-[color:var(--color-divider-strong)]">
          {pasos.map((p) => (
            <div
              key={p.n}
              className="bg-[color:var(--color-bg)] p-8 md:p-10 flex flex-col gap-5"
            >
              <span
                className="mono text-xs tracking-[0.22em] text-[color:var(--color-accent)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {p.n}
              </span>
              <h3
                className="lowercase font-semibold leading-[0.95]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                {p.titulo}
              </h3>
              <p className="text-[color:var(--color-text-2)] leading-relaxed">
                {p.cuerpo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/*  PARA QUIÉN — lista canon                                     */
/* ============================================================ */

function ParaQuien() {
  const duos = [
    { tipo: "parejas", nota: "casadas o no" },
    { tipo: "amigos", nota: "de los que se rajan" },
    { tipo: "novios", nota: "o quedantes" },
    { tipo: "roommates", nota: "con gym buddy pact" },
    { tipo: "hermanos", nota: "accountability sin papá" },
    { tipo: "amantes", nota: "relaciones no oficiales" },
    { tipo: "rivales", nota: "incluso si se odian", emphasis: true },
  ];

  return (
    <section className="border-t border-[color:var(--color-divider-strong)] px-6 md:px-10 py-20 md:py-28">
      <div className="max-w-6xl">
        <Eyebrow className="mb-6">para quién</Eyebrow>
        <h2
          className="lowercase font-bold leading-[0.92] tracking-tight max-w-3xl"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
            letterSpacing: "-0.04em",
          }}
        >
          cualquier dos<br />con algo que decirse.
        </h2>

        <ul className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--color-divider)]">
          {duos.map((d) => (
            <li
              key={d.tipo}
              className={`bg-[color:var(--color-bg)] p-6 md:p-7 flex items-baseline justify-between gap-4 ${
                d.emphasis ? "ring-1 ring-[color:var(--color-accent)]/40" : ""
              }`}
            >
              <span
                className="lowercase font-semibold"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
                  letterSpacing: "-0.03em",
                  color: d.emphasis ? "var(--color-accent)" : "var(--color-text)",
                }}
              >
                {d.tipo}
              </span>
              <span className="mono text-[10px] tracking-[0.18em] uppercase text-[color:var(--color-text-3)] text-right">
                {d.nota}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================ */
/*  DIFERENCIAL — rivalry highlight                              */
/* ============================================================ */

function Diferencial() {
  return (
    <section className="border-t border-[color:var(--color-divider-strong)] px-6 md:px-10 py-20 md:py-28 bg-[color:var(--color-surface-1)]">
      <div className="max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Eyebrow className="mb-6">lo que nadie más hace</Eyebrow>
          <div
            className="lowercase font-semibold leading-[0.95] text-[color:var(--color-accent)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              letterSpacing: "-0.04em",
            }}
          >
            el trato que funciona<br />aunque se odien.
          </div>
        </div>

        <div className="md:col-span-7 grid gap-6 text-lg text-[color:var(--color-text-2)] leading-relaxed">
          <p>
            Todas las otras apps asumen que los dos se quieren bien:
            "tu pareja te apoya", "tu coach te recuerda". Lindo. Inútil
            cuando uno de los dos prefiere ver al otro perder.
          </p>
          <p>
            dovo no te pide que se caigan bien. Pide skin in the game
            simétrico: los dos riesgan, los dos ganan. La rivalidad no es
            bug, es feature. Funciona con tu mejor amigo y con tu peor
            enemigo deportivo — lo único que importa es que firmen.
          </p>
          <p className="mono text-xs tracking-[0.18em] uppercase text-[color:var(--color-text-4)]">
            español mx · sin sermones · sin mocking en inglés clinical
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/*  PRICING                                                      */
/* ============================================================ */

function Pricing() {
  return (
    <section className="border-t border-[color:var(--color-divider-strong)] px-6 md:px-10 py-20 md:py-28">
      <div className="max-w-5xl">
        <Eyebrow className="mb-6">cómo cobra</Eyebrow>
        <h2
          className="lowercase font-bold leading-[0.92] tracking-tight max-w-3xl"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
            letterSpacing: "-0.04em",
          }}
        >
          $99 mxn al mes.<br />por dúo, no por cabeza.
        </h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-px bg-[color:var(--color-divider-strong)]">
          <div className="bg-[color:var(--color-bg)] p-8 md:p-10">
            <span className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-accent)]">
              primeros 200 dúos
            </span>
            <p
              className="mt-4 lowercase font-extrabold leading-none text-[color:var(--color-accent)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 7vw, 5rem)",
                letterSpacing: "-0.05em",
              }}
            >
              gratis
            </p>
            <p className="mt-6 text-[color:var(--color-text-2)] max-w-md">
              Si te apuntas a la waitlist y cumples requisitos, eres uno
              de los 200 que arman su primer trato sin pagar nunca,
              mientras la app exista.
            </p>
          </div>

          <div className="bg-[color:var(--color-bg)] p-8 md:p-10">
            <span className="mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-3)]">
              después · dúo pro
            </span>
            <p
              className="mt-4 lowercase font-extrabold leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 7vw, 5rem)",
                letterSpacing: "-0.05em",
              }}
            >
              $99<span className="text-[color:var(--color-text-3)] text-2xl ml-2">mxn/mes</span>
            </p>
            <p className="mt-6 text-[color:var(--color-text-2)] max-w-md">
              Un solo cobro por dúo. Los dos usan todo: rachas, catálogos,
              coach AI semanal, nudges por WhatsApp, premios. Sin tiers
              individuales — el producto no existe con uno solo.
            </p>
          </div>
        </div>

        <p className="mt-10 mono text-xs tracking-[0.18em] uppercase text-[color:var(--color-text-4)] max-w-2xl">
          mvp sin custodia de dinero — los castigos se pagan entre ustedes (efectivo, transferencia, lo que sea). Custodia oficial llega cuando la regulación lo permita.
        </p>
      </div>
    </section>
  );
}

/* ============================================================ */
/*  WAITLIST                                                     */
/* ============================================================ */

function WaitlistSection() {
  return (
    <section
      id="waitlist"
      className="border-t border-[color:var(--color-divider-strong)] px-6 md:px-10 py-20 md:py-28 bg-[color:var(--color-surface-1)]"
    >
      <div className="max-w-3xl">
        <Eyebrow className="mb-6">apartar lugar</Eyebrow>
        <h2
          className="lowercase font-bold leading-[0.92] tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
            letterSpacing: "-0.04em",
          }}
        >
          uno se apunta.<br />el otro se entera después.
        </h2>
        <p className="mt-6 mb-12 text-lg text-[color:var(--color-text-2)] max-w-xl">
          Basta con que tú confirmes. Cuando abramos el cupo, te mandamos
          el link y desde ahí invitas al otro de tu dúo.
        </p>

        <WaitlistForm />
      </div>
    </section>
  );
}

/* ============================================================ */
/*  FOOTER                                                       */
/* ============================================================ */

function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-divider-strong)] px-6 md:px-10 py-12 mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--color-text-4)]">
      <div className="max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Mark size={18} />
          <Wordmark size="sm" />
          <span className="text-[color:var(--color-text-4)]">· lo prometido es deuda</span>
        </div>
        <span>cdmx · {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
