import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getPrepFor } from "@/lib/data/prep";
import CheckList from "@/app/components/CheckList";

export default async function PrepPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const tasks = getPrepFor(profile.id);

  const checkItems = tasks.map((t) => ({
    id: t.id,
    primary: (
      <div>
        <p className="font-bold text-sm">
          {t.title}
          <span
            className="ml-2 mono text-[10px]"
            style={{ color: "var(--color-accent)" }}
          >
            {t.duration}
          </span>
        </p>
        <div className="prose-sm mt-2 text-xs text-[var(--color-muted)] whitespace-pre-line leading-relaxed">
          {renderMarkdownish(t.content)}
        </div>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Prep dominical · 40 min
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Sin esto, la semana se cae
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-xl">
          Solo te muestro las tareas que te tocan a ti
          {tasks.some((t) => t.user === "shared") &&
            " (más las compartidas con tu pareja)"}
          .
        </p>
      </header>

      <section className="card overflow-hidden">
        <CheckList
          storageKey={`prep-${profile.id}`}
          items={checkItems}
          accent="var(--color-accent)"
          emptyMessage="Sin tareas de prep esta semana."
        />
      </section>
    </div>
  );
}

// Quick & dirty markdown rendering — solo **bold** y newlines
function renderMarkdownish(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-1.5 last:mb-0">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-[var(--color-text)] font-bold">
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
