import Link from "next/link";
import { folioDate, isoWeek, pad } from "@/lib/dates";
import { Plate, Perforated, RuleWithMark } from "@/app/components/carnet";

export default function HomePage() {
  const now = new Date();
  const issue = pad(isoWeek(now), 2);

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Top reg-mark strip */}
      <div className="px-6 pt-6 flex items-center justify-between text-[color:var(--color-ink-mute)] mono text-[10px] tracking-widest">
        <span aria-hidden="true">⊕</span>
        <span>CARNET MIKE·ANDY · {folioDate(now)} · ED. W{issue}</span>
        <span aria-hidden="true">⊕</span>
      </div>

      {/* Cover */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="relative w-full max-w-3xl">
          <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-6">
            CARNET I · IMPRENTA PRIVADA
          </p>

          <h1
            className="font-extrabold leading-[0.85] tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3.5rem, 12vw, 8rem)",
            }}
          >
            <span className="text-[color:var(--color-plate-mike)]">Mike</span>
            <span className="text-[color:var(--color-ink-mute)]">·</span>
            <span className="text-[color:var(--color-plate-andy)]">Andy</span>
          </h1>

          {/* Epigraph — no subhead */}
          <p
            className="mt-6 max-w-md italic text-[color:var(--color-ink-soft)] leading-relaxed"
            style={{ fontFamily: "var(--font-stamp)", fontSize: "1.1rem" }}
          >
            Cuadernillo de disciplina a dos tintas. Cyan para él, magenta para
            ella; donde se sobreimprimen, hay lima.
          </p>

          <div className="my-12">
            <Perforated thick />
          </div>

          {/* Selector — two plates as the choice */}
          <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-4">
            REGISTRO — ¿QUIÉN ABRE LA PÁGINA?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <ProfileEntry
              href="/mike"
              who="mike"
              name="Mike"
              kcal={2400}
              protein={155}
              disciplines={["Gym", "Caminadora"]}
              serial="PL-M / 24K"
            />
            <ProfileEntry
              href="/andy"
              who="andy"
              name="Andy"
              kcal={1750}
              protein={115}
              disciplines={["Gym", "Ballet", "Pilates"]}
              serial="PL-A / 17K"
            />
          </div>

          {/* Overprint hint */}
          <div className="mt-12 flex items-start gap-4">
            <Plate who="both">Juntos</Plate>
            <p className="text-xs text-[color:var(--color-ink-mute)] leading-relaxed max-w-md">
              Cuando ambos cumplen el mismo día, se imprime el sobreimpreso —
              lima. Es el bono compartido.
            </p>
          </div>
        </div>
      </section>

      {/* Colophon */}
      <footer className="px-6 py-8">
        <RuleWithMark>colofón</RuleWithMark>
        <p className="mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)] text-center mt-4 leading-relaxed">
          IMPRESO EN MÉXICO · TIRADA DE DOS · NO PARA DISTRIBUCIÓN
          <br />
          <span className="text-[color:var(--color-ink-dim)] tracking-[0.16em] normal-case">
            Sesión recordada en este dispositivo. Cambiar:{" "}
            <Link
              href="/"
              className="text-[color:var(--color-overprint)] border-b border-[color:var(--color-overprint)]"
            >
              recargar carnet
            </Link>
          </span>
        </p>
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
  serial,
}: {
  href: string;
  who: "mike" | "andy";
  name: string;
  kcal: number;
  protein: number;
  disciplines: string[];
  serial: string;
}) {
  const accent =
    who === "mike" ? "var(--color-plate-mike)" : "var(--color-plate-andy)";
  return (
    <Link
      href={href}
      className="group relative block py-10 px-6 border-t md:border-t-0 md:border-l md:first:border-l-0 border-[color:var(--color-rule-strong)] transition-colors hover:bg-[color:var(--color-paper)]"
    >
      <div className="flex items-baseline justify-between mb-6">
        <Plate who={who}>{name}</Plate>
        <span className="mono text-[10px] tracking-widest text-[color:var(--color-ink-mute)]">
          {serial}
        </span>
      </div>

      <p
        className="font-extrabold tracking-tight leading-[0.82] mb-8 transition-transform group-hover:-translate-x-1"
        style={{
          color: accent,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(3.5rem, 9vw, 5.5rem)",
        }}
      >
        {name.toLowerCase()}
      </p>

      <div className="space-y-0">
        <div className="leader-row">
          <span className="label">Kcal</span>
          <span className="leader" aria-hidden="true" />
          <span className="value tabular">{kcal}</span>
        </div>
        <div className="leader-row">
          <span className="label">Proteína</span>
          <span className="leader" aria-hidden="true" />
          <span className="value tabular">{protein}g</span>
        </div>
        <div className="leader-row">
          <span className="label">Disciplinas</span>
          <span className="leader" aria-hidden="true" />
          <span className="value">{disciplines.join(" · ")}</span>
        </div>
      </div>

      <p
        className="mt-8 mono text-[11px] tracking-[0.25em] uppercase flex items-center gap-2 transition-transform group-hover:translate-x-1"
        style={{ color: accent }}
      >
        Entrar al carnet
        <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}
