"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import {
  BigStat,
  BracketLink,
  Eyebrow,
  RoleDot,
} from "@/app/components/ui";
import { Logo } from "@/app/components/brand";
import BlobHeroLazy from "@/app/three/BlobHeroLazy";

/**
 * Home — full-bleed Blob 3D + scroll-driven parallax + stagger fade-in.
 *
 * Patrón:
 *   · Blob bg z-0 — translateY/scale/rotate según scrollYProgress
 *   · Content overlay z-10 — staggered entrance via motion
 *   · Pair stats glass strip z-20 — slide-up al cargar
 *   · Noise overlay z-30 — textura fija
 *   · Section secundaria fuera del hero — entrada al perfil detallado
 *
 * Performance: motion usa MotionValues con CSS transforms, no React state →
 * 60fps de scroll independiente del React render loop.
 *
 * Reduced motion: si el OS lo pide, deshabilita parallax y stagger (entrada
 * instantánea). El blob 3D ya hace su propia detección via SceneBackground.
 */
export default function HomePage() {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  // Scroll progress 0..1 mientras el hero sale del viewport.
  // `["start start", "end start"]` = 0 cuando top=top de viewport,
  // 1 cuando bottom=top (hero ya pasó completamente).
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Blob parallax: se mueve más lento que el contenido (translate hacia abajo
  // al hacer scroll up), escala levemente, gira sutilmente.
  // Si reduced-motion, todo a identidad.
  const blobY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "30%"]);
  const blobScale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 1.15]);
  const blobRotate = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 12]);
  const blobOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.6, 0.2]);

  // Headline parallax inverso: se mueve hacia arriba más lento (sticky feel)
  const headlineY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "-20%"]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Stagger config
  const enter = reduced
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <main className="min-h-screen flex flex-col relative bg-[color:var(--color-bg)]">
      {/* === HERO FULL-BLEED === */}
      <section
        ref={heroRef}
        className="relative min-h-screen w-full overflow-hidden"
      >
        {/* Blob bg con parallax */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            y: blobY,
            scale: blobScale,
            rotate: blobRotate,
            opacity: blobOpacity,
            transformOrigin: "center center",
          }}
        >
          <BlobHeroLazy />
        </motion.div>

        {/* Content overlay z-10 */}
        <div className="relative z-10 flex min-h-screen flex-col">
          {/* Top nav — fade-in inmediato */}
          <motion.div
            className="px-6 pt-6 flex items-center justify-between mono text-[10px] tracking-widest text-[color:var(--color-text-3)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Logo layout="horizontal" size="md" />
            <span className="hidden sm:inline">disciplina compartida</span>
            <span>v1</span>
          </motion.div>

          {/* Centered hero content con stagger + headline parallax */}
          <div className="flex flex-1 items-center justify-center px-6">
            <motion.div
              className="mx-auto max-w-5xl text-center"
              style={{ y: headlineY, opacity: headlineOpacity }}
            >
              <motion.div {...enter} transition={{ duration: 0.6, delay: 0.15 }}>
                <Eyebrow className="justify-center mb-8">
                  <RoleDot who="both" />
                  <span>De dos · en uno</span>
                </Eyebrow>
              </motion.div>

              <motion.h1
                {...enter}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="font-extrabold lowercase leading-[0.85] tracking-tight text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(6rem, 18vw, 14rem)",
                  letterSpacing: "-0.05em",
                  textShadow: "0 6px 60px rgba(0,0,0,0.7)",
                }}
              >
                dovo
              </motion.h1>

              <motion.p
                {...enter}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-8 mx-auto max-w-xl text-lg md:text-xl text-white/85 leading-relaxed"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
              >
                No se cumple solo. Se cumple en dúo.
                <br />
                <span className="text-white/60 text-base md:text-lg">
                  Plan semanal de comidas y entreno sincronizado con el otro.
                </span>
              </motion.p>

              <motion.div
                {...enter}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-12 flex items-center justify-center gap-3 flex-wrap"
              >
                <Link href="/mike" className="btn-ink">
                  Entrar como Mike →
                </Link>
                <Link href="/andy" className="btn-ink">
                  Entrar como Andy →
                </Link>
              </motion.div>

              <motion.div
                {...enter}
                transition={{ duration: 0.6, delay: 0.85 }}
                className="mt-4 flex items-center justify-center"
              >
                <BracketLink href="/juntos">Vista compartida →</BracketLink>
              </motion.div>

              {/* Scroll hint — sólo si no reduced */}
              {!reduced && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 1, delay: 1.6 }}
                  className="mt-16 flex flex-col items-center gap-2 text-white/40"
                >
                  <span className="mono text-[9px] tracking-[0.3em] uppercase">
                    sigue scroll
                  </span>
                  <motion.span
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-base"
                  >
                    ↓
                  </motion.span>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Pair stats strip — slide up */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <PairStatsStrip />
          </motion.div>
        </div>

        {/* Noise overlay z-30 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 opacity-[0.04]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\"/%3E%3C/svg%3E')",
          }}
        />
      </section>

      {/* === SECCIÓN SECUNDARIA — entra desde abajo al scroll === */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-6 py-20">
        <FadeInSection>
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
        </FadeInSection>
      </section>

      <footer className="relative z-10 px-6 py-6 mono text-[10px] tracking-widest text-[color:var(--color-text-4)] text-center">
        dovo · privado · no compartas el link
      </footer>
    </main>
  );
}

/**
 * FadeInSection — wrapper que dispara fade-up cuando entra al viewport.
 * Uso para secciones largas que aparecen al scroll.
 */
function FadeInSection({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function PairStatsStrip() {
  return (
    <div className="relative z-20 border-t border-white/10 bg-[color:var(--color-bg)]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl px-6 py-7 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <ProfileAvatar who="mike" name="Mike" status="activo" />

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
        style={{ background: accentHex, borderColor: "var(--color-bg)" }}
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
      {mirror ? <>{label}{avatar}</> : <>{avatar}{label}</>}
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
