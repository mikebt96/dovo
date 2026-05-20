import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/utils/url";
import InviteLink from "./InviteLink";

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

  const t = await getTranslations("grupo");
  const tOnb = await getTranslations("onboarding");
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
            {t("eyebrow", { tipo: tOnb(`tipo.${grupo.tipo_grupo}`) })}
          </p>
          <h1 className="display text-3xl font-extrabold lowercase">{grupo.nombre_grupo}</h1>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          {t("back")}
        </Link>
      </header>

      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-widest opacity-60 mb-4">
          {t("members", { n: miembros.length })}
        </h2>
        <ul className="space-y-2">
          {miembros.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between border-b border-ink/15 py-3"
            >
              <span className="display font-medium lowercase">
                {m.users?.nombre ?? t("member")}
              </span>
              {m.role === "creator" && (
                <span className="text-xs uppercase tracking-widest text-signal opacity-80">
                  {t("creator")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-ink/15 pt-8">
        <h2 className="display text-xl font-bold lowercase mb-3">{t("inviteTitle")}</h2>
        <p className="text-sm opacity-70 mb-6">{t("inviteSubtitle")}</p>
        <InviteLink url={inviteUrl} />
      </section>
    </main>
  );
}
