import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Character = {
  fue: number;
  res: number;
  flex: number;
  vel: number;
  equ: number;
  vit: number;
  nivel: number;
  xp: number;
  prestige: number;
  class_name: string;
};

type Perfil = {
  peso_kg: number;
  altura_cm: number;
  edad: number;
  genero: string;
  bmr_calculado: number | null;
};

const STATS: { key: keyof Character; statKey: string }[] = [
  { key: "fue", statKey: "fue" },
  { key: "res", statKey: "res" },
  { key: "flex", statKey: "flex" },
  { key: "vel", statKey: "vel" },
  { key: "equ", statKey: "equ" },
  { key: "vit", statKey: "vit" },
];

export default async function PerfilPage() {
  const t = await getTranslations("perfil");
  const tStats = await getTranslations("stats");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: meRow } = await supabase
    .schema("core")
    .from("users")
    .select("nombre, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: char } = await supabase
    .schema("core")
    .from("user_character")
    .select("fue, res, flex, vel, equ, vit, nivel, xp, prestige, class_name")
    .eq("user_id", user.id)
    .maybeSingle<Character>();

  const { data: perfil } = await supabase
    .schema("core")
    .from("user_perfil_fisico")
    .select("peso_kg, altura_cm, edad, genero, bmr_calculado")
    .eq("user_id", user.id)
    .maybeSingle<Perfil>();

  const character: Character = char ?? {
    fue: 0,
    res: 0,
    flex: 0,
    vel: 0,
    equ: 0,
    vit: 0,
    nivel: 1,
    xp: 0,
    prestige: 0,
    class_name: "Novato",
  };

  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
            {t("eyebrow")}
          </p>
          <h1 className="display text-3xl font-extrabold lowercase">
            {meRow?.nombre ?? user.email}
          </h1>
          <p className="text-xs mono opacity-60 mt-1">
            {t("level", { n: character.nivel, clase: character.class_name })}
            {character.prestige > 0 && ` · prestige ${character.prestige}`}
          </p>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          {t("back")}
        </Link>
      </header>

      <section className="border-t border-b border-ink/15 py-8 mb-10">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-5">
          {t("attributes")}
        </p>
        <div className="space-y-3">
          {STATS.map(({ key, statKey }) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-sm w-28">{tStats(statKey)}</span>
              <div className="flex-1 h-2 bg-papel-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-signal"
                  style={{
                    width: `${Math.min(100, Math.round((Math.log10((character[key] as number) + 1) / 2.2) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-xs mono opacity-60 w-10 text-right">
                {Math.round(character[key] as number)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-50 mt-6">{t("attributesNote")}</p>
      </section>

      {perfil && (
        <section>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-4">
            {t("physicalData")}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Row label={t("weight")} value={`${perfil.peso_kg} kg`} />
            <Row label={t("height")} value={`${perfil.altura_cm} cm`} />
            <Row label={t("age")} value={t("ageValue", { n: perfil.edad })} />
            <Row label={t("gender")} value={perfil.genero} />
            {perfil.bmr_calculado && (
              <Row
                label={t("bmr")}
                value={t("bmrValue", { n: Math.round(perfil.bmr_calculado) })}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest opacity-60">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
