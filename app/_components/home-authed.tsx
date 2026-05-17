import { createClient } from "@/lib/supabase/server";

export default async function HomeAuthed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-svh px-6 py-12 bg-papel text-ink max-w-2xl mx-auto">
      <header className="flex justify-between items-end mb-16 pb-6 border-b border-ink">
        <h1 className="syne text-3xl lowercase">tus tratos</h1>
        <span className="text-xs uppercase tracking-widest opacity-60 mono">
          {user?.email}
        </span>
      </header>

      <section className="text-center py-24">
        <p className="syne text-2xl lowercase opacity-50 mb-6">
          todavía no hay tratos.
        </p>
        <p className="text-sm opacity-60 max-w-sm mx-auto">
          el siguiente plan implementa crear tratos e invitar a tu dúo.
        </p>
      </section>
    </main>
  );
}
