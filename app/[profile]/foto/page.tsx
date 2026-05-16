import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { getBodyPhotoSignedUrl } from "@/lib/storage";
import { BodyAnalysisSchema, type BodyAnalysis } from "@/lib/schemas/body-analysis";
import {
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import UploadForm from "./UploadForm";
import PhotoActions from "./PhotoActions";

// Zona sensible (middleware ya pide PIN antes de entrar) + datos por
// request → no prerender.
export const dynamic = "force-dynamic";

type PhotoRow = {
  id: number;
  taken_on: string;
  storage_path: string;
  ai_analysis: unknown;
  created_at: string;
};

export default async function FotoPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const accent = profile.id === "mike" ? "#6bf5ff" : "#ff6b9d";

  const photos = await loadPhotos(profile.id);

  return (
    <div className="space-y-12 pb-20">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>zona sensible</span>
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
          fotos.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Tracking visual semanal. Claude Vision analiza pose, definición y
          asimetrías. Datos privados — solo tú y el otro con el PIN.
        </p>
      </section>

      <HRule />

      <section>
        <SectionLabel>Subir foto</SectionLabel>
        <div className="mt-6">
          <UploadForm profile={profile.id} accent={accent} />
        </div>
      </section>

      <HRule />

      <section>
        <SectionLabel right={`${photos.length} fotos`}>Historial</SectionLabel>
        {photos.length === 0 ? (
          <p
            className="mt-6 italic text-[color:var(--color-text-3)] leading-relaxed"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Aún no subes fotos. La primera marca el baseline.
          </p>
        ) : (
          <ul className="mt-6 space-y-12">
            {photos.map((p) => (
              <PhotoCard
                key={p.id}
                row={p}
                profile={profile.id}
                accent={accent}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function loadPhotos(slug: "mike" | "andy"): Promise<PhotoRow[]> {
  try {
    const profile_id = await slugToUuid(slug);
    if (!profile_id) return [];
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from("body_photos")
      .select("id, taken_on, storage_path, ai_analysis, created_at")
      .eq("profile_id", profile_id)
      .order("taken_on", { ascending: false })
      .limit(50);
    if (error) return [];
    return (data ?? []) as PhotoRow[];
  } catch {
    return [];
  }
}

async function PhotoCard({
  row,
  profile,
  accent,
}: {
  row: PhotoRow;
  profile: "mike" | "andy";
  accent: string;
}) {
  const signedUrl = await getBodyPhotoSignedUrl(row.storage_path, 300);
  const parsed = BodyAnalysisSchema.safeParse(row.ai_analysis);
  const analysis: BodyAnalysis | null = parsed.success ? parsed.data : null;
  const analysisFailed =
    analysis?.pose_quality === "poor" &&
    analysis.visible_areas.length === 0 &&
    (analysis.caveats?.[0]?.includes("falló") ?? false);

  return (
    <li className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
      {/* Photo */}
      <div className="space-y-2">
        <div
          className="aspect-[3/4] border border-[color:var(--color-divider)] overflow-hidden bg-[color:var(--color-surface-1)]"
          style={{ borderTopColor: accent, borderTopWidth: 2 }}
        >
          {signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt={`Foto del ${row.taken_on}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="mono text-[10px] uppercase text-[color:var(--color-text-4)]">
                imagen no disponible
              </p>
            </div>
          )}
        </div>
        <p className="mono text-[10px] tabular tracking-widest text-[color:var(--color-text-3)]">
          {row.taken_on}
        </p>
        <PhotoActions
          profile={profile}
          photo_id={row.id}
          hasAnalysis={!!analysis && !analysisFailed}
        />
      </div>

      {/* Analysis */}
      <div className="space-y-5">
        {analysis === null ? (
          <p className="mono text-xs text-[color:var(--color-text-3)] uppercase tracking-widest">
            analizando…
          </p>
        ) : analysisFailed ? (
          <p
            className="mono text-xs uppercase tracking-widest"
            style={{ color: "var(--color-warning)" }}
          >
            ⚠ análisis falló — usa &ldquo;reanalizar&rdquo;
          </p>
        ) : (
          <AnalysisView analysis={analysis} accent={accent} />
        )}
      </div>
    </li>
  );
}

function AnalysisView({
  analysis,
  accent,
}: {
  analysis: BodyAnalysis;
  accent: string;
}) {
  const POSE_LABEL = {
    good: "buena",
    partial: "parcial",
    poor: "pobre",
  } as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="mono text-[10px] tracking-widest uppercase px-2 py-1 border"
          style={{
            color: analysis.pose_quality === "good" ? "var(--color-success)" : "var(--color-warning)",
            borderColor: "currentColor",
          }}
        >
          pose · {POSE_LABEL[analysis.pose_quality]}
        </span>
        {analysis.visible_areas.length > 0 && (
          <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-3)]">
            visible: {analysis.visible_areas.join(", ")}
          </span>
        )}
      </div>

      {analysis.observations.posture && (
        <ObsField label="Postura" text={analysis.observations.posture} />
      )}
      {analysis.observations.muscle_definition && (
        <ObsField
          label="Definición"
          text={analysis.observations.muscle_definition}
        />
      )}
      {analysis.observations.body_composition && (
        <ObsField
          label="Composición"
          text={analysis.observations.body_composition}
        />
      )}
      {analysis.observations.asymmetries &&
        analysis.observations.asymmetries.length > 0 && (
          <div>
            <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mb-1">
              Asimetrías
            </p>
            <ul className="list-disc list-inside text-sm text-[color:var(--color-text-2)] leading-relaxed">
              {analysis.observations.asymmetries.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

      {analysis.recommendations.length > 0 && (
        <div>
          <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mb-2">
            Recomendaciones
          </p>
          <ul className="space-y-3">
            {analysis.recommendations.map((r, i) => (
              <li key={i} className="border-l-2 pl-3" style={{ borderColor: accent }}>
                <p
                  className="mono text-[10px] tracking-widest uppercase"
                  style={{ color: accent }}
                >
                  {r.focus}
                </p>
                <p className="text-sm text-[color:var(--color-text-2)] leading-relaxed mt-1">
                  {r.suggestion}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.caveats && analysis.caveats.length > 0 && (
        <p className="mono text-[10px] italic text-[color:var(--color-text-4)] leading-relaxed">
          ⚠ {analysis.caveats.join(" · ")}
        </p>
      )}
    </div>
  );
}

function ObsField({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] mb-1">
        {label}
      </p>
      <p
        className="text-[color:var(--color-text-2)] leading-relaxed"
        style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}
      >
        {text}
      </p>
    </div>
  );
}
