import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { characterSheet } from "@/lib/leveling";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import CharacterCard from "@/app/_components/CharacterCard";

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

export default async function PerfilPage() {
  const t = await getTranslations("perfil");
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

  // Nivel, clase y tiers se DERIVAN de los stats (fuente de verdad), no de las
  // columnas nivel/class_name (que F2 dejó congeladas). Ver lib/leveling.
  const sheet = characterSheet(character, character.prestige);

  return (
    <main className="min-h-svh max-w-2xl lg:max-w-5xl mx-auto px-6 py-10 bg-papel text-ink">
      <AppNav active="perfil" />
      <PageHero eyebrow={t("eyebrow")} title={meRow?.nombre ?? user.email} />

      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:items-start">
      <section className="mb-10 anim-fade-up">
        <CharacterCard
          nivel={sheet.nivel}
          className={sheet.className}
          prestige={character.prestige}
          stats={character}
          tiers={sheet.tiers}
        />
        <div className="mt-4">
          <p className="text-[10px] mono uppercase tracking-widest opacity-50 mb-1">
            {t("xpToNext", { xp: sheet.xpParaSiguiente, n: sheet.nivel + 1 })}
          </p>
          <div className="h-1 bg-papel-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-signal anim-bar-w"
              style={{ width: `${Math.round(sheet.progresoNivel * 100)}%` }}
            />
          </div>
        </div>
        <p className="text-xs opacity-50 mt-6">{t("attributesNote")}</p>
      </section>

      <div>
      {/* F6 · Análisis corporal — acción desde el perfil (no es tab) */}
      <section className="mb-10 anim-fade-up" style={{ "--anim-delay": "80ms" } as React.CSSProperties}>
        <Link
          href="/perfil/scan"
          className="group flex items-center gap-4 rounded-2xl border border-signal/30 bg-signal/[0.04] p-5 hover:border-signal/60 transition-colors"
        >
          <span className="text-2xl">📸</span>
          <span className="flex-1 min-w-0">
            <span className="block display font-semibold lowercase">{t("scanCta")}</span>
            <span className="block text-xs opacity-60 mt-0.5">{t("scanCtaSub")}</span>
          </span>
          <span className="text-signal mono text-sm group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </section>

      {perfil && (
        <section>
          <p className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
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
      </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] mono uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
