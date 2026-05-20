import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/utils/url";
import InviteLink from "./InviteLink";

export const metadata = { title: "grupo · dovo" };
export const dynamic = "force-dynamic";

type Grupo = {
  id: string;
  nombre_grupo: string;
  tipo_grupo: string;
  invite_token: string;
  created_by: string;
};

type Miembro = {
  user_id: string;
  role: string;
  users: { nombre: string } | null;
};

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: grupo } = await supabase
    .schema("core")
    .from("tratos")
    .select("id, nombre_grupo, tipo_grupo, invite_token, created_by")
    .eq("id", id)
    .maybeSingle<Grupo>();

  if (!grupo) notFound();

  const { data: miembrosRaw } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("user_id, role, users!inner(nombre)")
    .eq("trato_id", id);

  const miembros = (miembrosRaw as unknown as Miembro[] | null) ?? [];
  const soyMiembro = miembros.some((m) => m.user_id === user.id);
  if (!soyMiembro) notFound();

  const inviteUrl = appUrl(`/invite/${grupo.invite_token}`);

  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
            grupo {grupo.tipo_grupo}
          </p>
          <h1 className="syne text-3xl lowercase">{grupo.nombre_grupo}</h1>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← inicio
        </Link>
      </header>

      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-widest opacity-60 mb-4">
          miembros ({miembros.length})
        </h2>
        <ul className="space-y-2">
          {miembros.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between border-b border-ink/15 py-3"
            >
              <span className="syne lowercase">
                {m.users?.nombre ?? "miembro"}
              </span>
              {m.role === "creator" && (
                <span className="text-xs uppercase tracking-widest opacity-50">
                  creador
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-ink pt-8">
        <h2 className="syne text-xl lowercase mb-3">invita a más</h2>
        <p className="text-sm opacity-70 mb-6">
          comparte este link para que se unan al grupo.
        </p>
        <InviteLink url={inviteUrl} />
      </section>
    </main>
  );
}
