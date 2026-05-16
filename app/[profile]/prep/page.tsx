import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getPrepFor } from "@/lib/data/prep";
import { folioSerial } from "@/lib/dates";
import CheckList from "@/app/components/CheckList";
import {
  Folio,
  Plate,
  Ticket,
  TicketHead,
  TicketFoot,
  Marginalia,
} from "@/app/components/carnet";

export default async function PrepPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const tasks = getPrepFor(profile.id);
  const accent =
    profile.id === "mike"
      ? "var(--color-plate-mike)"
      : "var(--color-plate-andy)";

  const sharedCount = tasks.filter((t) => t.user === "shared").length;
  const mineCount = tasks.length - sharedCount;

  const checkItems = tasks.map((t) => ({
    id: t.id,
    primary: (
      <div>
        <div className="flex items-baseline gap-3 mb-1">
          <p className="font-bold text-sm">{t.title}</p>
          <span
            className="mono text-[10px] tracking-widest"
            style={{ color: "var(--color-overprint)" }}
          >
            {t.duration}
          </span>
          {t.user === "shared" && <Plate who="both">Compart.</Plate>}
        </div>
        <div className="prose-sm mt-2 text-xs text-[color:var(--color-ink-mute)] whitespace-pre-line leading-relaxed">
          {renderMarkdownish(t.content)}
        </div>
      </div>
    ),
  }));

  return (
    <div className="space-y-10">
      <Folio serial={folioSerial(profile.id)} title="PARTE PREP · DOMINGO" />

      {/* Hero */}
      <section>
        <p className="mono text-[10px] tracking-[0.3em] text-[color:var(--color-ink-mute)] mb-2">
          {profile.displayName.toUpperCase()} · DOMINGO · 40 MIN
        </p>
        <h1
          className="font-extrabold tracking-tight leading-[0.85]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            color: accent,
          }}
        >
          sin esto,
          <br />
          la semana se cae.
        </h1>
        <p
          className="mt-5 italic text-[color:var(--color-ink-soft)] leading-relaxed max-w-xl"
          style={{ fontFamily: "var(--font-stamp)", fontSize: "1.05rem" }}
        >
          Sólo las tareas que te tocan a ti
          {sharedCount > 0 && <> (más las {sharedCount} compartidas con tu pareja)</>}.
        </p>
      </section>

      <Marginalia tag="Por qué importa">
        Cada tarea es un ahorro de fricción de la semana. Sin huevos hervidos,
        no hay snacks. Sin tofu marinado, no hay cena rápida. El prep no es
        ritual: es lo que mantiene la disciplina viable cuando es martes a las
        10 PM y no quieres pensar.
      </Marginalia>

      {/* The ticket */}
      <Ticket>
        <TicketHead
          eyebrow={`PARTE PREP · ${tasks.length} tareas`}
          title={
            <span>
              <span className="tabular">{mineCount}</span>
              <span className="text-[color:var(--color-ink-mute)] font-normal">
                {" tuyas · "}
              </span>
              <span className="tabular">{sharedCount}</span>
              <span className="text-[color:var(--color-ink-mute)] font-normal">
                {" compartidas"}
              </span>
            </span>
          }
          right={<Plate who={profile.id}>{profile.displayName}</Plate>}
        />
        <CheckList
          storageKey={`prep-${profile.id}`}
          items={checkItems}
          accent={accent}
          emptyMessage="Folio sin tareas esta semana."
        />
        <TicketFoot serial={`PREP·${profile.id.toUpperCase()}`} />
      </Ticket>
    </div>
  );
}

// Markdown ligero — sólo **bold** y newlines
function renderMarkdownish(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-1.5 last:mb-0">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-[color:var(--color-ink)] font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}
