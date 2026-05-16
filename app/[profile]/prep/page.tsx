import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getPrepFor } from "@/lib/data/prep";
import { mondayOf } from "@/lib/dates";
import { getPrepChecked, asRecord } from "@/lib/checksServer";
import { toggleCheck } from "@/lib/actions/checks";
import CheckList from "@/app/components/CheckList";
import {
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";

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
    profile.id === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";

  const week_start = mondayOf();
  const initialChecked = asRecord(
    await getPrepChecked(profile.id, week_start),
  );

  async function handleToggle(id: string, checked: boolean) {
    "use server";
    return toggleCheck({
      table: "prep_check",
      profile: profile!.id,
      key: id,
      week_start,
      checked,
    });
  }

  const checkItems = tasks.map((t, i) => ({
    id: t.id,
    primary: (
      <div>
        <p className="font-bold text-base leading-tight flex items-baseline gap-3">
          <span
            className="mono text-xs tabular text-[color:var(--color-text-4)]"
            style={{ minWidth: "1.5rem" }}
          >
            {String(i + 1).padStart(2, "0")}.
          </span>
          <span>{t.title}</span>
          <span
            className="mono text-[10px] tracking-widest uppercase"
            style={{ color: "var(--color-accent)" }}
          >
            {t.duration}
          </span>
        </p>
        <div className="prose-sm mt-3 ml-8 text-sm text-[color:var(--color-text-2)] whitespace-pre-line leading-relaxed">
          {renderMarkdownish(t.content)}
        </div>
      </div>
    ),
  }));

  return (
    <div className="space-y-12 pb-20">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>40 min · domingo</span>
        </Eyebrow>
        <h1
          className="font-extrabold lowercase tracking-tight leading-[0.85]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 9vw, 5.5rem)",
            color: "var(--color-text)",
            letterSpacing: "-0.04em",
          }}
        >
          domingo.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Sin estos 40 minutos, la semana se cae. Cocinas una vez, te
          comes el resto.
        </p>
      </section>

      <HRule />

      <SectionLabel right={`${tasks.length} tareas`}>Prep dominical</SectionLabel>

      <div className="mt-2">
        <CheckList
          storageKey={`prep-${profile.id}-${week_start}`}
          items={checkItems}
          accent={accent}
          emptyMessage="Sin tareas de prep esta semana."
          initialChecked={initialChecked}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}

function renderMarkdownish(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-1.5 last:mb-0">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-[color:var(--color-text)] font-bold">
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
