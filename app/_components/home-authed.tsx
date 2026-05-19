import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TratoCard, { type TratoCardData } from "./trato-card";

type TratoRow = {
  id: string;
  goal: string;
  frecuencia: string;
  duracion_dias: number;
  partner_email: string;
  estado: TratoCardData["estado"];
  creator_id: string;
  created_at: string;
};

export default async function HomeAuthed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tratos } = await supabase
    .schema("core")
    .from("tratos")
    .select(
      "id, goal, frecuencia, duracion_dias, partner_email, estado, creator_id, created_at",
    )
    .or(`creator_id.eq.${user.id},partner_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const rows: TratoRow[] = (tratos as TratoRow[] | null) ?? [];
  const cards: TratoCardData[] = rows.map((r) => ({
    id: r.id,
    goal: r.goal,
    frecuencia: r.frecuencia,
    duracion_dias: r.duracion_dias,
    partner_email: r.partner_email,
    estado: r.estado,
    isCreator: r.creator_id === user.id,
  }));

  return (
    <main className="min-h-svh px-6 py-12 bg-papel text-ink max-w-2xl mx-auto">
      <header className="flex justify-between items-end mb-12 pb-6 border-b border-ink">
        <h1 className="syne text-3xl lowercase">tus tratos</h1>
        <span className="text-xs uppercase tracking-widest opacity-60 mono">
          {user.email}
        </span>
      </header>

      {cards.length === 0 ? (
        <section className="text-center py-16">
          <p className="syne text-2xl lowercase opacity-50 mb-6">
            todavía no hay tratos.
          </p>
          <Link
            href="/trato/new"
            className="inline-block bg-ink text-papel px-6 py-3 syne lowercase"
          >
            hacer un trato →
          </Link>
        </section>
      ) : (
        <>
          <section>
            {cards.map((c) => (
              <TratoCard key={c.id} trato={c} />
            ))}
          </section>
          <div className="mt-10">
            <Link
              href="/trato/new"
              className="inline-block border border-ink px-6 py-3 syne lowercase"
            >
              + hacer otro trato
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
