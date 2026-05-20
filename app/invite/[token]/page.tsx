import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import JoinButton from "./JoinButton";

export const dynamic = "force-dynamic";

type Grupo = {
  id: string;
  nombre_grupo: string;
  tipo_grupo: string;
  estado: string;
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const t = await getTranslations("invite");
  const tOnb = await getTranslations("onboarding");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Token-based lookup vía service_role (bypassa RLS). El token ES el
  // credential — quien lo tenga puede ver el grupo para unirse.
  const service = createServiceClient();
  const { data: grupo } = await service
    .schema("core")
    .from("tratos")
    .select("id, nombre_grupo, tipo_grupo, estado")
    .eq("invite_token", token)
    .maybeSingle<Grupo>();

  if (!grupo) return <Shell title={t("notFound")} />;
  if (grupo.estado !== "activo") {
    return <Shell title={t("inactive")} />;
  }

  // No autenticado → mandar a sign-up con next al invite
  if (!user) {
    const next = encodeURIComponent(`/invite/${token}`);
    return (
      <Shell title={t("invitedTo", { name: grupo.nombre_grupo })}>
        <p className="text-sm opacity-70 mb-6">{t("signupPrompt")}</p>
        <Link
          href={`/sign-up?next=${next}`}
          className="block w-full bg-ink text-papel py-3 rounded-full display font-semibold lowercase text-center hover:bg-signal hover:text-white transition-colors"
        >
          {t("createAndJoin")}
        </Link>
        <Link
          href={`/sign-in?next=${next}`}
          className="block w-full border border-ink py-3 rounded-full display font-semibold lowercase text-center mt-3 hover:border-signal transition-colors"
        >
          {t("haveAccount")}
        </Link>
      </Shell>
    );
  }

  // Autenticado → botón unirse
  return (
    <Shell title={t("invitedTo", { name: grupo.nombre_grupo })}>
      <p className="text-sm opacity-70 mb-6">
        {t("joinPrompt", { tipo: tOnb(`tipo.${grupo.tipo_grupo}`) })}
      </p>
      <JoinButton token={token} />
    </Shell>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-svh max-w-xl mx-auto px-6 py-12 bg-papel text-ink flex flex-col justify-center">
      <Link
        href="/"
        className="syne text-2xl lowercase tracking-tight inline-block mb-10"
      >
        dovo
      </Link>
      <h1 className="display text-3xl font-extrabold lowercase mb-6">{title}</h1>
      {children}
    </main>
  );
}
