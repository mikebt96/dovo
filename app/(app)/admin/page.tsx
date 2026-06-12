import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import { isAdminEmail } from "@/lib/admin";
import { getAdminData, getInteligenciaPremios } from "@/lib/actions/admin";
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

  const [data, intel] = await Promise.all([getAdminData(), getInteligenciaPremios()]);
  if (!data) notFound();

  const liveFlags = data.flags.filter((f) => f.on).length;
  const maxSelladas = intel?.categorias[0]?.selladas ?? 0;

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
        className="card-game  relative overflow-hidden p-7 text-white mb-8"
      >
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${data.dbOk ? "bg-stat-vit" : "bg-rival"}`}
            style={{
              boxShadow: data.dbOk
                ? "0 0 16px color-mix(in srgb, var(--stat-vit) 53%, transparent)"
                : "0 0 16px color-mix(in srgb, var(--mode-rival) 53%, transparent)",
            }}
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

      {/* Inteligencia de premios: qué se juegan los dúos, agregado y anónimo —
          el activo para negociar descuentos con marcas (cine, restaurantes…) */}
      <section className="mb-10">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-1">
          inteligencia de premios · qué se juegan los dúos
        </h2>
        <p className="text-xs opacity-50 mb-4">
          para negociar con marcas: cuántos dúos apuestan cine, comida, viajes…
        </p>
        {!intel ? (
          /* null = falló una query (jamás disfrazar un error de estado vacío) */
          <p className="text-sm text-rival-deep">
            no se pudo cargar el agregado — revisa los logs del server.
          </p>
        ) : intel.totales.selladas > 0 ? (
          <>
            <div className="grid gap-2">
              {intel.categorias.map((c) => {
                // % solo sobre apuestas YA juzgadas por el Veredicto: las
                // vivas (semana en curso) no son incumplimiento todavía
                const resueltas = c.selladas - c.vivas;
                return (
                  <div key={c.categoria} className="rounded-xl border border-ink/10 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium">{c.label}</span>
                      <span className="text-[10px] mono opacity-50 tabular-nums">
                        {c.duos} {c.duos === 1 ? "dúo" : "dúos"}
                      </span>
                      <span className="ml-auto text-[10px] mono uppercase tracking-widest opacity-60 tabular-nums">
                        {c.selladas} selladas
                        {c.vivas > 0 && ` · ${c.vivas} en juego`}
                        {resueltas > 0 &&
                          ` · ${c.ganadas} cumplidas · ${Math.round((c.ganadas / resueltas) * 100)}%`}
                      </span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-ink/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-signal"
                        style={{
                          width: `${maxSelladas > 0 ? Math.max(4, Math.round((c.selladas / maxSelladas) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] mono uppercase tracking-[0.14em] opacity-40 tabular-nums">
              {intel.totales.selladas} apuestas
              {intel.totales.vivas > 0 && ` · ${intel.totales.vivas} en juego`} ·{" "}
              {intel.totales.duos} dúos · agregado y anónimo
              {intel.totales.excluidosOptOut > 0 &&
                ` · ${intel.totales.excluidosOptOut} fuera por opt-out`}
            </p>
            <p className="mt-1 text-[10px] mono uppercase tracking-[0.14em] opacity-40">
              ⚠ con marcas solo compartir categorías con ≥100 dúos — k-anonimato del aviso de
              privacidad
            </p>
          </>
        ) : (
          <p className="text-sm opacity-50">
            aún no hay apuestas selladas — la inteligencia nace cuando los dúos apuestan.
          </p>
        )}
      </section>

      {/* Crons: el Veredicto y el cierre de duelos NO pueden caerse en silencio */}
      <section className="mb-10">
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
          crons · veredicto y duelos
        </h2>
        <div className="grid gap-2">
          {data.crons.length === 0 && (
            <p className="text-sm opacity-50">sin jobs programados — eso ES un problema.</p>
          )}
          {data.crons.map((c) => {
            const estado =
              c.last_status === "succeeded"
                ? "ok"
                : c.last_status === "failed"
                  ? "falló"
                  : "sin correr aún";
            const dot =
              c.last_status === "succeeded"
                ? "bg-stat-vit"
                : c.last_status === "failed"
                  ? "bg-rival"
                  : "bg-ink/20";
            return (
              <div
                key={c.jobname}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 px-4 py-3"
              >
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-sm font-medium">{c.jobname}</span>
                <span className="text-[10px] mono opacity-50">{c.schedule} UTC</span>
                <span className="ml-auto text-[10px] mono uppercase tracking-widest opacity-60">
                  {estado}
                  {c.last_start &&
                    ` · ${new Date(c.last_start).toLocaleString("es-MX", { timeZone: "America/Mexico_City", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                </span>
                {c.last_status === "failed" && c.last_msg && (
                  <p className="w-full text-xs text-rival-deep mono">{c.last_msg}</p>
                )}
              </div>
            );
          })}
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
