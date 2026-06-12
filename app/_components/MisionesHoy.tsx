import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { hoyCDMX, diaSemanaCDMX, lunesSemanaCDMX } from "@/lib/workout/fecha";
import type { MealPlanRow } from "@/lib/nutrition/types";
import GameIcon from "./GameIcon";

// Las MISIONES DE HOY abren el lobby (mandato de Miguel): dieta y ejercicio
// como las dos misiones diarias del juego — no una lista de actividades.
// Misión entrenar = la sesión PRESCRITA del día (F9); misión comer = el menú
// de HOY del plan (F5). Estado real, jamás inventado (regla 16 del consejo):
// entrenar cumplida = check-in de hoy CDMX; comer cumplida = food_log de hoy.
type Sesion = { actividad_slug: string; titulo: string } | null;

export default async function MisionesHoy({
  sesionHoy,
  proximaTitulo,
}: {
  sesionHoy: Sesion;
  proximaTitulo: string | null; // día libre: la próxima sesión de la semana
}) {
  const t = await getTranslations("home");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const hoy = hoyCDMX();

  // ── misión entrenar: ¿ya hay check-in HOY? (misma regla que la munición) ──
  const { data: miembros } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id")
    .eq("user_id", user.id);
  const ids = (miembros ?? []).map((m) => (m as { id: string }).id);
  let trainDone = false;
  if (ids.length) {
    const { data: c } = await supabase
      .schema("core")
      .from("checkins")
      .select("id")
      .in("miembro_id", ids)
      .eq("fecha", hoy)
      .limit(1)
      .maybeSingle<{ id: string }>();
    trainDone = !!c;
  }

  // ── misión comer: el menú de HOY del plan semanal + ¿registró comida hoy? ──
  const { data: planRow } = await supabase
    .schema("core")
    .from("meal_plans")
    .select("id, week_start, source, plan")
    .eq("user_id", user.id)
    .eq("week_start", lunesSemanaCDMX())
    .maybeSingle<MealPlanRow>();
  const diaHoy =
    planRow?.plan?.dias?.find((d) => d.dia === diaSemanaCDMX()) ?? null;

  const { data: logHoy } = await supabase
    .schema("core")
    .from("food_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("fecha", hoy)
    .limit(1)
    .maybeSingle<{ id: string }>();
  const eatDone = !!logHoy;

  const Chip = ({ done }: { done: boolean }) =>
    done ? (
      <span
        className="shrink-0 inline-flex items-center gap-1 rounded-[10px] px-2 py-1 text-[10px] mono uppercase tracking-[0.14em]"
        style={{
          color: "#4adfb2",
          background: "color-mix(in srgb, #4adfb2 14%, transparent)",
        }}
      >
        ✓ {t("missionDone")}
      </span>
    ) : (
      <span className="shrink-0 text-[10px] mono uppercase tracking-[0.14em] text-white/40">
        {t("missionPending")}
      </span>
    );

  return (
    <section className="mb-8 anim-fade-up">
      <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-50 mb-3">
        {t("missionsTitle")}
      </h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {/* ── misión 1 · entrenar ── */}
        <Link
          href="/entrenamiento"
          className="card-game anim-lift group relative overflow-hidden p-5 text-white block"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] mono uppercase tracking-[0.22em] text-signal flex items-center gap-1.5">
              <GameIcon name="nivel" size={13} />
              {t("missionTrain")}
            </p>
            <Chip done={trainDone} />
          </div>
          <p className="mt-2.5 display font-extrabold lowercase leading-tight text-xl sm:text-2xl">
            {sesionHoy
              ? `${sesionHoy.actividad_slug} · ${sesionHoy.titulo}`
              : t("missionRest")}
          </p>
          {!sesionHoy && proximaTitulo && (
            <p className="mt-1 text-xs text-white/50">{proximaTitulo}</p>
          )}
          {!trainDone && (
            <span className="mt-3 inline-flex items-center text-[11px] mono uppercase tracking-[0.16em] text-signal group-hover:translate-x-1 transition-transform">
              {t("missionGo")}
            </span>
          )}
        </Link>

        {/* ── misión 2 · comer bien ── */}
        <Link
          href="/nutricion"
          className="card-game anim-lift group relative overflow-hidden p-5 text-white block"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] mono uppercase tracking-[0.22em] flex items-center gap-1.5"
              style={{ color: "#4adfb2" }}
            >
              <GameIcon name="chispa" size={13} />
              {t("missionEat")}
            </p>
            <Chip done={eatDone} />
          </div>
          {diaHoy ? (
            <>
              <p className="mt-2.5 display font-extrabold lowercase leading-tight text-xl sm:text-2xl tabular-nums">
                {t("missionMeals", {
                  n: diaHoy.comidas.length,
                  kcal: planRow!.plan.kcal_objetivo,
                })}
              </p>
              <p className="mt-1 text-xs text-white/55 truncate">
                {diaHoy.comidas.map((c) => c.nombre).join(" · ")}
              </p>
            </>
          ) : (
            <p className="mt-2.5 display font-extrabold lowercase leading-tight text-xl sm:text-2xl">
              {t("missionEatSetup")}
            </p>
          )}
          {!eatDone && (
            <span className="mt-3 inline-flex items-center text-[11px] mono uppercase tracking-[0.16em] group-hover:translate-x-1 transition-transform"
              style={{ color: "#4adfb2" }}
            >
              {diaHoy ? t("missionMenu") : t("missionMenuSetup")}
            </span>
          )}
        </Link>
      </div>
    </section>
  );
}
