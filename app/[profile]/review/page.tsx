import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { mondayOf } from "@/lib/dates";
import {
  WeeklyRecommendationsSchema,
  type WeeklyRecommendations,
} from "@/lib/schemas/weekly-review";
import {
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import GenerateButton from "./GenerateButton";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: number;
  week_start: string;
  summary_md: string | null;
  body_analysis_md: string | null;
  recommendations: unknown;
  generated_at: string;
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const reviews = await loadReviews(profile.id);
  const currentWeek = mondayOf();
  const hasCurrentReview = reviews.some((r) => r.week_start === currentWeek);

  return (
    <div className="space-y-12 pb-20">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>coach review</span>
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
          revisión.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Cada domingo el coach lee tu semana — comidas, ejercicios, peso,
          fotos — y te entrega un análisis con ajustes para la siguiente.
        </p>
      </section>

      <HRule />

      {/* Generar review esta semana */}
      <section>
        <SectionLabel right={currentWeek}>Esta semana</SectionLabel>
        <div className="mt-5">
          {hasCurrentReview ? (
            <p className="mono text-xs tracking-widest uppercase text-[color:var(--color-text-3)]">
              Ya tienes review esta semana. Genera otra para reemplazarla.
            </p>
          ) : (
            <p className="mono text-xs tracking-widest uppercase text-[color:var(--color-text-3)]">
              Sin review todavía. Genera la primera o espera al domingo 21:00.
            </p>
          )}
          <div className="mt-4">
            <GenerateButton profile={profile.id} weekStart={currentWeek} />
          </div>
        </div>
      </section>

      <HRule />

      <section>
        <SectionLabel right={`${reviews.length} reviews`}>Historial</SectionLabel>
        {reviews.length === 0 ? (
          <p
            className="mt-6 italic text-[color:var(--color-text-3)] leading-relaxed"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Sin reviews todavía. El cron corre los domingos a las 21:00, o
            usa el botón de arriba para generar una bajo demanda.
          </p>
        ) : (
          <ul className="mt-6 space-y-16">
            {reviews.map((r) => (
              <ReviewCard key={r.id} row={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function loadReviews(slug: "mike" | "andy"): Promise<ReviewRow[]> {
  try {
    const profile_id = await slugToUuid(slug);
    if (!profile_id) return [];
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from("weekly_reviews")
      .select("id, week_start, summary_md, body_analysis_md, recommendations, generated_at")
      .eq("profile_id", profile_id)
      .order("week_start", { ascending: false })
      .limit(12);
    if (error) return [];
    return (data ?? []) as ReviewRow[];
  } catch {
    return [];
  }
}

function ReviewCard({ row }: { row: ReviewRow }) {
  const parsed = WeeklyRecommendationsSchema.safeParse(row.recommendations);
  const rec: WeeklyRecommendations | null = parsed.success ? parsed.data : null;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2
          className="font-extrabold tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            letterSpacing: "-0.02em",
          }}
        >
          semana del {row.week_start}
        </h2>
        <p className="mono text-[10px] tabular tracking-widest text-[color:var(--color-text-4)]">
          gen {new Date(row.generated_at).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {row.summary_md && (
        <div
          className="prose-coach text-[color:var(--color-text-2)] leading-relaxed"
          style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}
        >
          {row.summary_md.split("\n").map((line, i) => (
            <p key={i} className="mb-3">
              {renderInlineMarkdown(line)}
            </p>
          ))}
        </div>
      )}

      {row.body_analysis_md && row.body_analysis_md.toLowerCase() !== "sin fotos esta semana." && (
        <div className="mt-6 pl-4 border-l-2 border-[color:var(--color-divider-strong)]">
          <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mb-2">
            Análisis visual
          </p>
          <p
            className="text-[color:var(--color-text-2)] leading-relaxed"
            style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem" }}
          >
            {row.body_analysis_md}
          </p>
        </div>
      )}

      {rec && (
        <div className="mt-8 space-y-5">
          {rec.kcal_next_week && (
            <RecBlock
              label="Calorías próxima semana"
              value={`${rec.kcal_next_week.delta > 0 ? "+" : ""}${rec.kcal_next_week.delta} kcal`}
              reason={rec.kcal_next_week.reason}
            />
          )}
          {rec.protein_g_next_week && (
            <RecBlock
              label="Proteína próxima semana"
              value={`${rec.protein_g_next_week.target}g`}
              reason={rec.protein_g_next_week.reason}
            />
          )}

          {rec.training_changes && rec.training_changes.length > 0 && (
            <div>
              <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mb-3">
                Ajustes entreno
              </p>
              <ul className="space-y-3">
                {rec.training_changes.map((c, i) => (
                  <li key={i} className="border-l-2 border-[color:var(--color-accent)] pl-3">
                    <p
                      className="mono text-[10px] tracking-widest uppercase"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {c.change_type} · {c.target}
                    </p>
                    <p className="text-sm text-[color:var(--color-text-2)] leading-relaxed mt-1">
                      {c.reason}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rec.alerts && rec.alerts.length > 0 && (
            <div>
              <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mb-3">
                Alertas
              </p>
              <ul className="space-y-2">
                {rec.alerts.map((a, i) => {
                  const color =
                    a.severity === "critical"
                      ? "var(--color-danger)"
                      : a.severity === "warning"
                        ? "var(--color-warning)"
                        : "var(--color-text-3)";
                  return (
                    <li
                      key={i}
                      className="border-l-2 pl-3"
                      style={{ borderColor: color }}
                    >
                      <p
                        className="mono text-[10px] tracking-widest uppercase"
                        style={{ color }}
                      >
                        {a.severity}
                      </p>
                      <p className="text-sm text-[color:var(--color-text-2)] leading-relaxed mt-1">
                        {a.message}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {rec.encouragement && (
            <p
              className="mt-6 italic text-[color:var(--color-text)] leading-relaxed"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.05rem",
              }}
            >
              &ldquo;{rec.encouragement}&rdquo;
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function RecBlock({
  label,
  value,
  reason,
}: {
  label: string;
  value: string;
  reason: string;
}) {
  return (
    <div>
      <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)]">
        {label}
      </p>
      <p
        className="font-extrabold tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          color: "var(--color-accent)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      <p className="text-sm text-[color:var(--color-text-2)] leading-relaxed mt-1">
        {reason}
      </p>
    </div>
  );
}

/** Markdown ligero: **bold** y nada más. Suficiente para coach text. */
function renderInlineMarkdown(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="text-[color:var(--color-text)] font-bold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
