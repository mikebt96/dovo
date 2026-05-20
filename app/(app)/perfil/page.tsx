import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "perfil · dovo" };
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

const STATS: { key: keyof Character; label: string }[] = [
  { key: "fue", label: "Fuerza" },
  { key: "res", label: "Resistencia" },
  { key: "flex", label: "Flexibilidad" },
  { key: "vel", label: "Velocidad" },
  { key: "equ", label: "Equilibrio" },
  { key: "vit", label: "Vitalidad" },
];

export default async function PerfilPage() {
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
            tu personaje
          </p>
          <h1 className="syne text-3xl lowercase">
            {meRow?.nombre ?? user.email}
          </h1>
          <p className="text-xs mono opacity-60 mt-1">
            nivel {character.nivel} · {character.class_name}
            {character.prestige > 0 && ` · prestige ${character.prestige}`}
          </p>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← inicio
        </Link>
      </header>

      <section className="border-t border-b border-ink py-8 mb-10">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-5">
          atributos
        </p>
        <div className="space-y-3">
          {STATS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-sm w-28">{label}</span>
              <div className="flex-1 h-2 bg-papel-dark">
                <div
                  className="h-full bg-ink"
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
        <p className="text-xs opacity-50 mt-6">
          tus atributos suben con cada check-in (llega en la siguiente
          actualización).
        </p>
      </section>

      {perfil && (
        <section>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-4">
            datos físicos
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Row label="Peso" value={`${perfil.peso_kg} kg`} />
            <Row label="Altura" value={`${perfil.altura_cm} cm`} />
            <Row label="Edad" value={`${perfil.edad} años`} />
            <Row label="Género" value={perfil.genero} />
            {perfil.bmr_calculado && (
              <Row
                label="Metabolismo basal"
                value={`${Math.round(perfil.bmr_calculado)} kcal/día`}
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
