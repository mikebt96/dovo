import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "./AppNav";
import Grain from "./Grain";
import CheckinRow from "./CheckinRow";
import DuoProof from "./DuoProof";
import CharacterCard from "./CharacterCard";
import { characterSheet } from "@/lib/leveling";
import { getBoostActivo } from "@/lib/actions/boosts";
import { getDuoTier } from "@/lib/billing/tier";
import { diaSemanaCDMX } from "@/lib/workout/fecha";
import { DIAS_SEMANA, type WorkoutPlanContent } from "@/lib/workout/types";

type Character = {
  fue: number;
  res: number;
  flex: number;
  vel: number;
  equ: number;
  vit: number;
  nivel: number;
  prestige: number;
  class_name: string;
};

type Grupo = {
  id: string;
  nombre_grupo: string;
  tipo_grupo: string;
};

// claves i18n sin acentos para los días del plan (mismo patrón que /nutricion y /rutina).
const DAY_KEY: Record<string, string> = {
  lunes: "lunes",
  martes: "martes",
  "miércoles": "miercoles",
  jueves: "jueves",
  viernes: "viernes",
  "sábado": "sabado",
  domingo: "domingo",
};

export default async function HomeAuthed() {
  const t = await getTranslations("home");
  const tDias = await getTranslations("nutricion.dias");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: charRow } = await supabase
    .schema("core")
    .from("user_character")
    .select("fue, res, flex, vel, equ, vit, nivel, prestige, class_name")
    .eq("user_id", user.id)
    .maybeSingle<Character>();

  const { data: streakRow } = await supabase
    .schema("core")
    .from("user_streak")
    .select("current_streak_weeks")
    .eq("user_id", user.id)
    .maybeSingle<{ current_streak_weeks: number }>();

  const { data: miembros } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id, trato_id, tratos!inner(id, nombre_grupo, tipo_grupo)")
    .eq("user_id", user.id);

  const character: Character = charRow ?? {
    fue: 0,
    res: 0,
    flex: 0,
    vel: 0,
    equ: 0,
    vit: 0,
    nivel: 1,
    prestige: 0,
    class_name: "Novato",
  };
  // nivel + clase se derivan de los stats (no de las columnas congeladas). Ver lib/leveling.
  const sheet = characterSheet(character, character.prestige);
  const racha = streakRow?.current_streak_weeks ?? 0;
  const boost = await getBoostActivo();
  const duo = await getDuoTier();
  const miembrosList = (miembros ?? []) as unknown as Array<{
    id: string;
    tratos: Grupo;
  }>;
  const grupos: Grupo[] = miembrosList.map((m) => m.tratos as unknown as Grupo);

  // MVP: el primer grupo/miembro maneja la sección "Hoy".
  const miembroId = miembrosList[0]?.id;
  const primerGrupoId = grupos[0]?.id;

  type RutinaItem = { actividad_id: string; duracion_min: number };
  let rutinaItems: RutinaItem[] = [];
  const actividadMap = new Map<
    string,
    { nombre: string; metricas_requeridas: string[] }
  >();

  // F11 · La sesión PRESCRITA de hoy (F9) como héroe de la home: la app abre con
  // "hoy te toca", no con un dashboard. Lectura ligera del plan jsonb.
  let planContent: WorkoutPlanContent | null = null;
  if (miembroId) {
    const { data: wp, error: wpErr } = await supabase
      .schema("core")
      .from("workout_plans")
      .select("plan")
      .eq("miembro_id", miembroId)
      .maybeSingle<{ plan: WorkoutPlanContent }>();
    if (wpErr) console.error("[home] workout plan:", wpErr.message);
    planContent = wp?.plan ?? null;
  }
  const hoyNombre = diaSemanaCDMX();
  const sesionHoy = planContent?.dias.find((d) => d.dia === hoyNombre) ?? null;
  // Día libre: la próxima sesión en orden de semana (con vuelta al lunes).
  const proxima = (() => {
    if (!planContent || sesionHoy) return null;
    const idxHoy = DIAS_SEMANA.indexOf(hoyNombre as (typeof DIAS_SEMANA)[number]);
    for (let i = 1; i <= 7; i++) {
      const dia = DIAS_SEMANA[(idxHoy + i) % 7];
      const d = planContent.dias.find((x) => x.dia === dia);
      if (d) return d;
    }
    return null;
  })();

  if (miembroId) {
    const { data: rutina } = await supabase
      .schema("core")
      .from("user_rutinas")
      .select("actividades")
      .eq("miembro_id", miembroId)
      .eq("is_default", true)
      .maybeSingle<{ actividades: unknown }>();
    rutinaItems = Array.isArray(rutina?.actividades)
      ? (rutina!.actividades as RutinaItem[])
      : [];

    if (rutinaItems.length) {
      const ids = rutinaItems.map((i) => i.actividad_id);
      const { data: acts } = await supabase
        .schema("core")
        .from("actividades")
        .select("id, nombre, metricas_requeridas")
        .in("id", ids);
      for (const a of (acts ?? []) as Array<{
        id: string;
        nombre: string;
        metricas_requeridas: string[];
      }>) {
        actividadMap.set(a.id, {
          nombre: a.nombre,
          metricas_requeridas: a.metricas_requeridas,
        });
      }
    }
  }

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-5xl mx-auto">
      <AppNav active="home" />

      {boost && (
        <div className="mb-6 rounded-xl border border-signal/40 bg-signal/5 px-4 py-3">
          <p className="text-xs mono uppercase tracking-widest text-signal">
            {t("boostActive", { nombre: boost.de_nombre ?? "tu dúo" })}
          </p>
          {boost.tipo === "energia" && (
            <p className="text-xs opacity-60 mt-1">{t("boostActiveEnergia")}</p>
          )}
        </div>
      )}

      {/* F11 · Héroe del día: la acción antes que las stats. Panel oscuro premium
          (mismo lenguaje que DuelScoreboard/macros) con la sesión prescrita de hoy. */}
      {planContent && (
        <section className="mb-8 anim-fade-up">
          <Link
            href="/entrenamiento"
            className="anim-lift group block relative overflow-hidden rounded-3xl p-7 sm:p-8 text-white"
            style={{
              background:
                "radial-gradient(130% 150% at 12% 0%, #16132a 0%, #0b0a14 55%, #07060d 100%)",
              boxShadow: "0 24px 60px -28px rgba(109,74,255,0.55)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(109,74,255,0.5), transparent 70%)" }}
            />
            <p className="relative text-[11px] mono uppercase tracking-[0.22em] text-signal mb-3">
              {sesionHoy ? t("heroEyebrow") : t("heroRest")}
            </p>
            {sesionHoy ? (
              <>
                <h2 className="relative display font-extrabold lowercase leading-none text-3xl sm:text-4xl">
                  {sesionHoy.actividad_slug} · {sesionHoy.titulo}
                </h2>
                <ul className="relative mt-5 space-y-1.5">
                  {sesionHoy.bloques.slice(0, 4).map((b) => (
                    <li key={b.exercise_slug} className="flex items-baseline gap-3 text-sm">
                      <span className="text-white/85">{b.nombre}</span>
                      <span className="mono tabular-nums text-[11px] text-white/45">
                        {b.series}×{b.reps}
                      </span>
                    </li>
                  ))}
                  {sesionHoy.bloques.length > 4 && (
                    <li className="text-[11px] mono text-white/35">
                      +{sesionHoy.bloques.length - 4}
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <>
                <h2 className="relative display font-extrabold lowercase leading-none text-3xl sm:text-4xl">
                  {t("heroRestBody")}
                </h2>
                {proxima && (
                  <p className="relative mt-4 text-sm text-white/60">
                    {t("heroNext", {
                      dia: tDias(DAY_KEY[proxima.dia] ?? proxima.dia),
                      titulo: proxima.titulo,
                    })}
                  </p>
                )}
              </>
            )}
            <span className="relative mt-6 inline-flex items-center text-[12px] mono uppercase tracking-[0.16em] text-signal group-hover:translate-x-1 transition-transform">
              {sesionHoy ? t("heroCta") : t("heroVerSemana")}
            </span>
          </Link>
        </section>
      )}

      {/* Character card — el ancla de la app (DESIGN.md §6) */}
      <section className="mb-8">
        <CharacterCard
          nivel={sheet.nivel}
          className={sheet.className}
          racha={racha}
          prestige={character.prestige}
          stats={character}
          tiers={sheet.tiers}
        />
      </section>

      <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
      {/* Hoy: actividades de la rutina default, registrables con un tap */}
      <section className="mb-8 lg:mb-0">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-50 mb-3">
          {t("todayTitle")}
        </h2>
        {!miembroId ? (
          <p className="text-sm opacity-50">{t("todayNoGroup")}</p>
        ) : rutinaItems.length === 0 ? (
          <Link
            href={`/grupo/${primerGrupoId}/rutina`}
            className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
          >
            {t("buildRoutine")}
          </Link>
        ) : (
          <div className="space-y-3">
            {rutinaItems.map((i) => {
              const a = actividadMap.get(i.actividad_id);
              if (!a) return null;
              return (
                <CheckinRow
                  key={i.actividad_id}
                  miembroId={miembroId}
                  actividadId={i.actividad_id}
                  nombre={a.nombre}
                  metricasRequeridas={a.metricas_requeridas}
                  duracionDefault={i.duracion_min}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Grupos */}
      <section>
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-50 mb-3">
          {t("groupsTitle")}
        </h2>
        {grupos.length === 0 ? (
          <div className="space-y-6">
            <DuoProof />
            <Link
              href="/onboarding/grupo"
              className="inline-block bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
            >
              {t("createGroup")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {grupos.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/grupo/${g.id}`}
                  className="block border border-ink/15 rounded-xl p-4 hover:border-signal transition-colors"
                >
                  <span className="display font-medium lowercase">{g.nombre_grupo}</span>
                  <span className="text-xs opacity-60 ml-2">
                    {g.tipo_grupo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>

      {/* Upsell Pro — editorial, no agresivo. Solo dúos free (oculto para demo=pro). */}
      {duo.tier === "free" && !duo.isDemo && grupos.length > 0 && (
        <Link
          href="/suscripcion"
          className="group block rounded-2xl border border-signal/30 bg-signal/[0.04] p-6 mt-10 hover:border-signal/60 transition-colors"
        >
          <p className="text-[11px] mono uppercase tracking-[0.22em] text-signal mb-2">
            {t("proUpsellEyebrow")}
          </p>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="display text-2xl font-bold lowercase">
                {t("proUpsellTitle")}
              </p>
              <p className="text-sm opacity-65 mt-1 max-w-md leading-relaxed">
                {t("proUpsellBody")}
              </p>
            </div>
            <span className="shrink-0 text-sm mono uppercase tracking-[0.14em] text-signal group-hover:translate-x-1 transition-transform">
              {t("proUpsellCta")}
            </span>
          </div>
        </Link>
      )}
      <Grain />
    </main>
  );
}
