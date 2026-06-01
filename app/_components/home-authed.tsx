import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import LanguageToggle from "./LanguageToggle";
import CheckinRow from "./CheckinRow";
import DuoProof from "./DuoProof";
import { characterSheet } from "@/lib/leveling";

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

const STAT_LABELS: { key: keyof Character; label: string }[] = [
  { key: "fue", label: "FUE" },
  { key: "res", label: "RES" },
  { key: "flex", label: "FLE" },
  { key: "vel", label: "VEL" },
  { key: "equ", label: "EQU" },
  { key: "vit", label: "VIT" },
];

// Mapea un stat (log sin cap) a una altura de barra 0-100% para display.
// Tier display real llega en F3; por ahora una escala simple log.
function barHeight(v: number): number {
  if (v <= 0) return 4;
  return Math.min(100, Math.round((Math.log10(v + 1) / 2.2) * 100));
}

export default async function HomeAuthed() {
  const t = await getTranslations("home");
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
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto">
      <header className="flex justify-between items-start mb-8">
        <Link href="/" className="syne text-2xl lowercase tracking-tight">
          dovo
        </Link>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-widest opacity-60">
          <Link href="/perfil" className="hover:opacity-100">
            {t("navProfile")}
          </Link>
          <Link href="/ajustes" className="hover:opacity-100">
            {t("navSettings")}
          </Link>
          <LanguageToggle />
        </nav>
      </header>

      {/* Character header: stats compactas + nivel + clase + racha */}
      <section className="border-t border-b border-ink/15 py-6 mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <p className="display font-semibold lowercase">
            {t("level", { n: sheet.nivel, clase: sheet.className })}
          </p>
          <p className="text-xs uppercase tracking-widest opacity-60">
            {t("streak", { n: racha })}
          </p>
        </div>
        <div className="flex gap-2 items-end h-16">
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-12 bg-papel-dark rounded-sm relative flex items-end overflow-hidden">
                <div
                  className="w-full bg-signal"
                  style={{ height: `${barHeight(character[key] as number)}%` }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-wider opacity-60">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Hoy: actividades de la rutina default, registrables con un tap */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-widest opacity-60 mb-3">
          {t("todayTitle")}
        </h2>
        {!miembroId ? (
          <p className="text-sm opacity-50">{t("todayNoGroup")}</p>
        ) : rutinaItems.length === 0 ? (
          <Link
            href={`/grupo/${primerGrupoId}/rutina`}
            className="inline-block bg-ink text-papel px-6 py-3 display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
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
        <h2 className="text-xs uppercase tracking-widest opacity-60 mb-3">
          {t("groupsTitle")}
        </h2>
        {grupos.length === 0 ? (
          <div className="space-y-6">
            <DuoProof />
            <Link
              href="/onboarding/grupo"
              className="inline-block bg-ink text-papel px-6 py-3 display font-semibold lowercase hover:bg-signal hover:text-white transition-colors"
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
                  className="block border border-ink/15 rounded-lg p-4 hover:border-signal transition-colors"
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
    </main>
  );
}
