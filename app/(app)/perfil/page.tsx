import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VisibilityToggle from "./_components/VisibilityToggle";

export const metadata = { title: "perfil · dovo" };
export const dynamic = "force-dynamic";

type Visibility = "hidden" | "duos_con_trato" | "publico";

type Score = {
  tratos_cerrados: number;
  tratos_cumplidos: number;
  score_publico: number;
  visibility: Visibility;
};

type ClosedTrato = {
  id: string;
  goal: string;
  resultado:
    | "ambos_cumplieron"
    | "uno_fallo"
    | "ambos_fallaron"
    | "sin_resolver"
    | null;
  creator_id: string;
  partner_id: string | null;
  creator_cumplio: boolean | null;
  partner_cumplio: boolean | null;
  closed_at: string;
  duracion_dias: number;
};

const RESULTADO_TAG: Record<NonNullable<ClosedTrato["resultado"]>, string> = {
  ambos_cumplieron: "los dos cumplieron",
  uno_fallo: "uno cumplió",
  ambos_fallaron: "ninguno cumplió",
  sin_resolver: "sin resolver",
};

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

  const { data: scoreRow } = await supabase
    .schema("core")
    .from("user_scores")
    .select("tratos_cerrados, tratos_cumplidos, score_publico, visibility")
    .eq("user_id", user.id)
    .maybeSingle<Score>();

  const score: Score = scoreRow ?? {
    tratos_cerrados: 0,
    tratos_cumplidos: 0,
    score_publico: 0,
    visibility: "hidden",
  };

  const { data: closed } = await supabase
    .schema("core")
    .from("tratos")
    .select(
      "id, goal, resultado, creator_id, partner_id, creator_cumplio, partner_cumplio, closed_at, duracion_dias",
    )
    .eq("estado", "cerrado")
    .or(`creator_id.eq.${user.id},partner_id.eq.${user.id}`)
    .order("closed_at", { ascending: false })
    .limit(20);

  const history = (closed as ClosedTrato[] | null) ?? [];

  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
            tu perfil
          </p>
          <h1 className="syne text-3xl lowercase">
            {meRow?.nombre ?? user.email}
          </h1>
          <p className="text-xs mono opacity-60 mt-1">{user.email}</p>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← inicio
        </Link>
      </header>

      <section className="border-t border-b border-ink py-10 mb-12 text-center">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
          score
        </p>
        <p className="syne text-7xl">{score.score_publico}</p>
        <p className="text-sm opacity-70 mt-3">
          {score.tratos_cumplidos} cumplidos de {score.tratos_cerrados} cerrados
        </p>
      </section>

      <section className="mb-12">
        <VisibilityToggle current={score.visibility} />
      </section>

      <section>
        <h2 className="syne text-xl lowercase mb-6">historial</h2>
        {history.length === 0 ? (
          <p className="text-sm opacity-60">
            todavía no cierras tratos. cuando uno termine, aparece aquí.
          </p>
        ) : (
          <ul className="space-y-4">
            {history.map((t) => (
              <HistoryItem key={t.id} trato={t} userId={user.id} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function HistoryItem({
  trato,
  userId,
}: {
  trato: ClosedTrato;
  userId: string;
}) {
  const isCreator = trato.creator_id === userId;
  const userCumplio = isCreator ? trato.creator_cumplio : trato.partner_cumplio;
  const resultLabel = trato.resultado
    ? RESULTADO_TAG[trato.resultado]
    : "cerrado";

  return (
    <li className="border-b border-ink/15 pb-4">
      <Link
        href={`/trato/${trato.id}`}
        className="block hover:opacity-70 transition-opacity"
      >
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <p className="syne lowercase">{trato.goal}</p>
          <span
            className={`text-xs uppercase tracking-widest shrink-0 ${
              userCumplio ? "opacity-90" : "opacity-50"
            }`}
          >
            {userCumplio ? "cumpliste" : "fallaste"}
          </span>
        </div>
        <p className="text-xs opacity-60">
          {resultLabel} · {trato.duracion_dias} días
        </p>
      </Link>
    </li>
  );
}
