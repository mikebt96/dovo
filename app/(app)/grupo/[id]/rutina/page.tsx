import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import { getWorkoutData } from "@/lib/actions/workout";
import { POR_SLUG } from "@/lib/workout/catalog";
import { diaSemanaCDMX } from "@/lib/workout/fecha";
import { topeReps } from "@/lib/workout/progresion";
import type { SerieLog } from "@/lib/workout/types";
import RutinaForm from "./RutinaForm";
import LogExerciseButton from "./LogExerciseButton";
import AiWorkoutButton from "./AiWorkoutButton";

export const dynamic = "force-dynamic";
// La action de IA (regenerateWorkoutAi) puede tardar: extiende el límite de la ruta.
export const maxDuration = 60;

type Actividad = {
  id: string;
  slug: string;
  nombre: string;
  metricas_requeridas: string[];
};

// claves i18n sin acentos para los días (mismo patrón que /nutricion).
const DAY_KEY: Record<string, string> = {
  lunes: "lunes",
  martes: "martes",
  "miércoles": "miercoles",
  jueves: "jueves",
  viernes: "viernes",
  "sábado": "sabado",
  domingo: "domingo",
};

/** "3×10 @ 40 kg" (o "10/9/8 @ 40 kg" si las reps varían). */
function fmtSeries(series: SerieLog[]): string {
  if (!Array.isArray(series) || series.length === 0) return "";
  const reps = series.map((s) => s.reps);
  const pesos = series.map((s) => s.peso_kg).filter((p): p is number => typeof p === "number" && p > 0);
  const repsTxt = new Set(reps).size === 1 ? `${series.length}×${reps[0]}` : reps.join("/");
  return pesos.length ? `${repsTxt} @ ${Math.max(...pesos)} kg` : repsTxt;
}

export default async function RutinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("rutina");
  const tDias = await getTranslations("nutricion.dias");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id")
    .eq("trato_id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  if (!miembro) redirect("/");

  const { data: actividades, error: actsErr } = await supabase
    .schema("core")
    .from("actividades")
    .select("id, slug, nombre, metricas_requeridas")
    .eq("activa", true)
    .order("nombre");
  if (actsErr) console.error("[rutina] actividades:", actsErr.message);

  const { data: rutina, error: rutErr } = await supabase
    .schema("core")
    .from("user_rutinas")
    .select("nombre, actividades")
    .eq("miembro_id", miembro.id)
    .eq("is_default", true)
    .maybeSingle<{ nombre: string; actividades: unknown }>();
  if (rutErr) console.error("[rutina] rutina:", rutErr.message);

  // ── Sin rutina aún: configuración primero (comportamiento original) ──
  if (!rutina) {
    return (
      <main className="min-h-svh max-w-2xl mx-auto px-6 py-10 bg-papel text-ink">
        <AppNav />
        <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        <p className="text-sm opacity-60 mb-6">{t("noPlanHint")}</p>
        <RutinaForm
          grupoId={id}
          miembroId={miembro.id}
          actividades={(actividades ?? []) as Actividad[]}
          inicial={null}
        />
      </main>
    );
  }

  const data = await getWorkoutData(id);

  // ── Rutina sin perfil físico: el plan necesita la meta del onboarding ──
  if (!data.fisico) {
    return (
      <main className="min-h-svh max-w-2xl mx-auto px-6 py-10 bg-papel text-ink">
        <AppNav />
        <PageHero eyebrow={t("eyebrow")} title={t("noFisicoTitle")} subtitle={t("noFisicoBody")} />
        <Link
          href="/onboarding/perfil"
          className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
        >
          {t("noFisicoCta")}
        </Link>
      </main>
    );
  }

  const plan = data.plan;
  const hoy = diaSemanaCDMX();
  const loggedHoy = new Map(data.logsHoy.map((l) => [l.exercise_slug, l.id]));

  return (
    <main className="min-h-svh max-w-2xl lg:max-w-5xl mx-auto px-6 py-10 bg-papel text-ink">
      <AppNav />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("planSubtitle")} />

      {plan && (
        <>
          {/* Header del plan: badge de fuente + botón IA */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className={`text-[10px] mono uppercase tracking-[0.18em] rounded-full px-3 py-1.5 border ${
                plan.source === "ai"
                  ? "border-signal/40 text-signal"
                  : "border-ink/15 opacity-60"
              }`}
            >
              {plan.source === "ai" ? `✦ ${t("badgeAi")}` : t("badgeSample")}
            </span>
            <span className="flex-1" />
            <AiWorkoutButton
              grupoId={id}
              aiLive={data.aiLive}
              entitledAi={data.entitledAi}
              prefsIniciales={plan.prefs ?? {}}
            />
          </div>

          {/* Recordatorio de check-in cuando ya registró ejercicios hoy */}
          {data.logsHoy.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-signal/30 bg-signal/5 px-4 py-3 mb-6">
              <p className="text-sm">{t("checkinReminder")}</p>
              <Link
                href="/"
                className="text-[10px] mono uppercase tracking-[0.16em] text-signal underline underline-offset-2"
              >
                {t("checkinLink")} →
              </Link>
            </div>
          )}

          {/* Semana prescrita */}
          <h2 className="text-[11px] mono uppercase tracking-[0.22em] opacity-50 mb-4">
            {t("planTitle")}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2 mb-4">
            {plan.plan.dias.map((d) => {
              const esHoy = d.dia === hoy;
              return (
                <section
                  key={d.dia}
                  className={`rounded-2xl border p-5 ${
                    esHoy ? "border-signal shadow-[0_8px_30px_-12px_rgba(109,74,255,0.35)]" : "border-ink/12"
                  }`}
                >
                  {/* El día ancla la tarjeta (DESIGN.md §4); actividad+título como caption (review F9). */}
                  <header className="mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="display text-xl font-bold lowercase leading-none">
                        {tDias(DAY_KEY[d.dia] ?? d.dia)}
                      </h3>
                      {esHoy && (
                        <span className="text-[9px] mono uppercase tracking-[0.18em] bg-signal text-white rounded-full px-2 py-0.5">
                          {t("today")}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] mono uppercase tracking-[0.16em] opacity-60 mt-1.5">
                      {d.actividad_slug} · {d.titulo}
                    </p>
                  </header>

                  <ul className="space-y-4">
                    {d.bloques.map((b, i) => {
                      const ej = POR_SLUG.get(b.exercise_slug);
                      const prog = data.progresion[b.exercise_slug];
                      return (
                        <li key={`${b.exercise_slug}-${i}`} className="border-t border-ink/8 pt-3 first:border-t-0 first:pt-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-medium">{b.nombre}</span>
                            <span className="text-sm tabular-nums opacity-70">
                              {b.series}×{b.reps}
                            </span>
                            {b.descanso_seg > 0 && (
                              <span className="text-[10px] mono uppercase tracking-wider opacity-60">
                                {t("restLabel")} {b.descanso_seg}s
                              </span>
                            )}
                            <span className="flex-1" />
                            {/* El logger vive SOLO en la tarjeta de hoy: registrar siempre
                                loguea con fecha de hoy, y así el mismo ejercicio en otro
                                día no aparece "registrado" (review F9). */}
                            {esHoy && (
                              <LogExerciseButton
                                grupoId={id}
                                slug={b.exercise_slug}
                                conPeso={ej?.con_peso ?? false}
                                simple={!ej?.con_peso && topeReps(b.reps) === null}
                                defaultSeries={b.series}
                                defaultReps={topeReps(b.reps)}
                                sugerenciaKg={prog?.sugerencia_kg ?? null}
                                loggedId={loggedHoy.get(b.exercise_slug) ?? null}
                              />
                            )}
                          </div>
                          {b.nota && <p className="text-xs opacity-60 mt-1">{b.nota}</p>}
                          {prog && (
                            <div className="mt-1.5">
                              <p className="text-[10px] mono tabular-nums opacity-60">
                                {t("lastTime")}: {fmtSeries(prog.ultima_series)}
                              </p>
                              {/* "hoy intenta X" como objetivo motivacional, no un dato más (review F9). */}
                              {prog.sugerencia_kg != null && (
                                <p
                                  className="display font-bold text-signal text-base mt-0.5"
                                  style={{ textShadow: "0 0 16px rgba(109,74,255,0.3)" }}
                                >
                                  {t("suggested")} {prog.sugerencia_kg} kg ↗
                                </p>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          {plan.plan.nota && <p className="text-sm opacity-60 max-w-prose mb-10">{plan.plan.nota}</p>}
        </>
      )}

      {/* Config de disciplinas (colapsada — cambiarla regenera el plan) */}
      <details className="rounded-2xl border border-ink/12 px-5 py-4">
        <summary className="cursor-pointer list-none flex items-center gap-3">
          <span className="text-[11px] mono uppercase tracking-[0.22em] opacity-60">
            {t("configToggle")}
          </span>
          <span className="text-xs opacity-40">{t("configHint")}</span>
        </summary>
        <div className="pt-5">
          <RutinaForm
            grupoId={id}
            miembroId={miembro.id}
            actividades={(actividades ?? []) as Actividad[]}
            inicial={rutina}
          />
        </div>
      </details>
    </main>
  );
}
