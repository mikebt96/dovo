import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import Paywall from "@/app/_components/Paywall";
import ProBadge from "@/app/_components/ProBadge";
import { getEntitlement } from "@/lib/billing/tier";
import { getNutritionData } from "@/lib/actions/nutrition";
import type { DiaPlan } from "@/lib/nutrition/types";
import { diaSemanaCDMX, DAY_KEY } from "@/lib/workout/fecha";
import NutritionProfileForm from "./_components/NutritionProfileForm";
import FoodLogQuickAdd from "./_components/FoodLogQuickAdd";
import FoodFab from "./_components/FoodFab";
import AiRegenButton from "./_components/AiRegenButton";
import ComidaInteractiva from "./_components/ComidaInteractiva";

export const dynamic = "force-dynamic";
// La action de IA (regenerateWithAi) puede tardar: extiende el límite de la ruta.
export const maxDuration = 60;


export default async function NutricionPage() {
  const t = await getTranslations("nutricion");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { entitled } = await getEntitlement("nutrition");

  // Gate Pro (F7): sin acceso, hero + Paywall con teaser — fail-soft, nunca bloque duro.
  if (!entitled) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
        <AppNav />
        <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
        <Paywall
          feature="nutrition"
          title={t("paywallTitle")}
          blurb={t("paywallBlurb")}
          preview={<PlanTeaser />}
        />
      </main>
    );
  }

  const data = await getNutritionData();

  // Necesita el perfil físico del onboarding (BMR es la base de los macros).
  if (!data.fisico) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
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

  // Onboarding nutricional (1 pantalla) si aún no hay perfil.
  if (!data.nutricion) {
    return (
      <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
        <AppNav />
        <PageHero eyebrow={t("eyebrow")} title={t("setupTitle")} subtitle={t("setupSubtitle")} />
        <NutritionProfileForm />
      </main>
    );
  }

  const plan = data.plan;
  // CDMX, no el reloj del server (Vercel = UTC ⇒ "hoy" se volvía mañana a las 18:00)
  const hoyNombre = diaSemanaCDMX();
  const favoritos = data.nutricion.favoritos ?? [];

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-6xl mx-auto">
      <AppNav />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {plan && (
        <>
          {/* Header de macros — superficie de juego (Mesa Nocturna) */}
          <section className="card-game relative overflow-hidden p-7 sm:p-9 text-white mb-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(109,74,255,0.5), transparent 70%)" }}
            />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="flex items-end gap-4">
                <div
                  className="display font-extrabold leading-[0.8] text-6xl sm:text-7xl tabular-nums"
                  style={{ textShadow: "0 0 44px rgba(109,74,255,0.45)" }}
                >
                  {plan.plan.kcal_objetivo}
                </div>
                <div className="pb-2 text-[11px] mono uppercase tracking-[0.22em] text-white/60 leading-relaxed">
                  {t("kcalDia")}
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <Macro label="P" value={plan.plan.macros.prot} color="#6d4aff" />
                <Macro label="C" value={plan.plan.macros.carb} color="#3a86ff" />
                <Macro label="G" value={plan.plan.macros.grasa} color="#aef03c" />
              </div>
            </div>
            <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] mono uppercase tracking-[0.18em] rounded-full px-3 py-1.5 ${
                    plan.source === "ai"
                      ? "bg-signal/30 text-white"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {plan.source === "ai" ? `✦ ${t("badgeAi")}` : t("badgeSample")}
                </span>
                {/* plan de dúo: mismos platillos, tu dosis (regla de oro) */}
                {plan.plan.duo && (
                  <span
                    className="text-[10px] mono uppercase tracking-[0.18em] rounded-full px-3 py-1.5"
                    style={{
                      color: "#4adfb2",
                      background: "color-mix(in srgb, #4adfb2 14%, transparent)",
                    }}
                  >
                    {t("badgeDuo")}
                  </span>
                )}
              </span>
              <AiRegenButton aiLive={data.aiLive} />
            </div>
          </section>

          {/* Plan semanal: L-D en menús DESPLEGABLES (spec del founder) — hoy
              abierto, cada alimento con su palomita (gustó / no gustó → swap). */}
          <section className="mb-10">
            <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
              {t("semanaTitle")}
            </h2>
            <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
              {plan.plan.dias.map((d, i) => (
                <DiaAccordion
                  key={d.dia}
                  dia={d}
                  diaIdx={i}
                  esHoy={d.dia === hoyNombre}
                  dayLabel={t(`dias.${DAY_KEY[d.dia] ?? "lunes"}`)}
                  hoyLabel={t("hoyChip")}
                  favoritos={favoritos}
                  dosisCompa={
                    data.dosisCompa
                      ? {
                          nombre: data.dosisCompa.nombre,
                          ratio: data.dosisCompa.kcal / Math.max(1, plan.plan.kcal_objetivo),
                        }
                      : null
                  }
                />
              ))}
            </div>
            {plan.plan.nota && (
              <p className="text-sm opacity-60 mt-4 max-w-xl leading-relaxed">
                {plan.plan.nota}
              </p>
            )}
          </section>

          {/* Lista del súper */}
          <section className="mb-10">
            <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
              {t("superTitle")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plan.plan.lista_super.map((p) => (
                <div key={p.pasillo} className="rounded-xl border border-ink/10 p-4">
                  <div className="text-[10px] mono uppercase tracking-widest text-signal mb-2">
                    {p.pasillo}
                  </div>
                  <ul className="text-sm opacity-80 space-y-1">
                    {p.items.map((it) => (
                      <li key={it}>· {it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Logging de hoy — inline en desktop, FAB + bottom-sheet en mobile */}
      <section className="mb-10 hidden lg:block">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-1">
          {t("logTitle")}
        </h2>
        <p className="text-sm opacity-60 mb-4">{t("logSub")}</p>
        <FoodLogQuickAdd logs={data.logsHoy} />
      </section>

      {/* FAB bottom-sheet — solo mobile (lg:hidden dentro del componente) */}
      <FoodFab logs={data.logsHoy} />

      <p className="text-[10px] mono uppercase tracking-[0.16em] opacity-40 max-w-md leading-relaxed pb-20 lg:pb-0">
        {t("disclaimer")}
      </p>
    </main>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="display font-bold text-2xl tabular-nums" style={{ color }}>
        {value}g
      </div>
      <div className="text-[10px] mono uppercase tracking-widest text-white/70 mt-1">{label}</div>
    </div>
  );
}

// Día desplegable: <details> nativo (cero JS para abrir/cerrar), hoy abierto.
// El summary es la carta del día: nombre + kcal totales + chip HOY.
function DiaAccordion({
  dia,
  diaIdx,
  esHoy,
  dayLabel,
  hoyLabel,
  favoritos,
  dosisCompa,
}: {
  dia: DiaPlan;
  diaIdx: number;
  esHoy: boolean;
  dayLabel: string;
  hoyLabel: string;
  favoritos: string[];
  dosisCompa: { nombre: string; ratio: number } | null;
}) {
  const kcalDia = dia.comidas.reduce((s, c) => s + c.kcal, 0);
  return (
    <details
      open={esHoy}
      className={`group rounded-2xl border ${
        esHoy ? "border-signal bg-signal/[0.04]" : "border-ink/10"
      }`}
    >
      <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        <span className="flex items-center gap-2">
          <span
            className={`display font-bold lowercase ${esHoy ? "text-signal" : ""}`}
          >
            {dayLabel}
          </span>
          {esHoy && (
            <span className="text-[9px] mono uppercase tracking-[0.18em] rounded-full px-2 py-0.5 bg-signal text-white">
              {hoyLabel}
            </span>
          )}
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] mono opacity-50 tabular-nums">
            {kcalDia} kcal
          </span>
          <span
            aria-hidden
            className="text-[10px] mono opacity-40 transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-ink/8">
        {dia.comidas.map((c, ci) => (
          <ComidaInteractiva
            key={`${ci}-${c.tipo}-${c.nombre}`}
            diaIdx={diaIdx}
            comidaIdx={ci}
            comida={c}
            esFavorito={favoritos.includes(c.nombre)}
            dosisCompa={dosisCompa}
          />
        ))}
      </div>
    </details>
  );
}

// Teaser estático del plan para el Paywall (preview blureado del gate).
function PlanTeaser() {
  const filas = [
    ["desayuno", "Chilaquiles verdes con huevo", "460 kcal"],
    ["comida", "Arroz con pollo a la mexicana", "560 kcal"],
    ["cena", "Tacos de frijol con queso", "430 kcal"],
  ];
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="display text-xl font-bold lowercase">meal plan semanal</span>
        <ProBadge tier="pro" />
      </div>
      <div className="space-y-3 max-w-sm">
        {filas.map(([tipo, nombre, kcal]) => (
          <div key={tipo} className="rounded-xl border border-ink/10 p-3">
            <div className="text-[9px] mono uppercase tracking-widest text-signal/80">{tipo}</div>
            <div className="text-sm font-medium">{nombre}</div>
            <div className="text-[10px] mono opacity-45">{kcal}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
