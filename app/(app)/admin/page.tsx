import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import { isAdminEmail } from "@/lib/admin";
import { getAdminData } from "@/lib/actions/admin";
import AdminTools from "./_components/AdminTools";

export const dynamic = "force-dynamic";

// Consola de admin (solo ADMIN_EMAILS; cualquier otro recibe 404 — la página "no existe").
// es-only a propósito: superficie interna de operación, no producto.
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (!isAdminEmail(user.email)) notFound();

  const data = await getAdminData();
  if (!data) notFound();

  const liveFlags = data.flags.filter((f) => f.on).length;

  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-3xl mx-auto">
      <AppNav />
      <PageHero
        eyebrow="consola"
        title="estado del sistema."
        subtitle="salud, flags y errores — solo tus ojos."
      />

      {/* Status global — panel oscuro premium */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 text-white mb-8"
        style={{
          background:
            "radial-gradient(130% 150% at 12% 0%, #16132a 0%, #0b0a14 55%, #07060d 100%)",
          boxShadow: "0 24px 60px -28px rgba(109,74,255,0.55)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${data.dbOk ? "bg-stat-vit" : "bg-red-500"}`}
            style={{ boxShadow: data.dbOk ? "0 0 16px #aef03c88" : "0 0 16px #ef444488" }}
          />
          <span className="display text-2xl font-bold lowercase">
            {data.dbOk ? "operativa" : "con fallos"}
          </span>
          <span className="ml-auto text-[10px] mono uppercase tracking-[0.18em] text-white/50">
            {liveFlags}/{data.flags.length} APIs vivas
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          {data.counts.map((c) => (
            <div key={c.name}>
              <div className="display font-extrabold text-2xl tabular-nums">
                {c.value < 0 ? "—" : c.value}
              </div>
              <div className="text-[9px] mono uppercase tracking-widest text-white/45 mt-1">
                {c.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flags sandbox-first */}
      <section className="mb-10">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
          flags · sandbox-first
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.flags.map((f) => (
            <div
              key={f.name}
              className="flex items-center gap-3 rounded-xl border border-ink/10 px-4 py-3"
            >
              <span
                className={`h-2 w-2 rounded-full ${f.on ? "bg-stat-vit" : "bg-ink/20"}`}
              />
              <span className="text-sm">{f.name}</span>
              <span className="ml-auto text-[10px] mono uppercase tracking-widest opacity-50">
                {f.on ? "live" : "sandbox"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <AdminTools errors={data.errors} />
    </main>
  );
}
