import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import JoinButton from "./JoinButton";

export const metadata = { title: "invitación · dovo" };
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

  if (!grupo) return <Shell title="invitación no existe" />;
  if (grupo.estado !== "activo") {
    return <Shell title="este grupo ya no está activo" />;
  }

  // No autenticado → mandar a sign-up con next al invite
  if (!user) {
    const next = encodeURIComponent(`/invite/${token}`);
    return (
      <Shell title={`te invitaron a "${grupo.nombre_grupo}"`}>
        <p className="text-sm opacity-70 mb-6">
          crea tu cuenta para unirte al grupo.
        </p>
        <Link
          href={`/sign-up?next=${next}`}
          className="block w-full bg-ink text-papel py-3 syne lowercase text-center"
        >
          crear cuenta y unirme
        </Link>
        <Link
          href={`/sign-in?next=${next}`}
          className="block w-full border border-ink py-3 syne lowercase text-center mt-3"
        >
          ya tengo cuenta
        </Link>
      </Shell>
    );
  }

  // Autenticado → botón unirse
  return (
    <Shell title={`te invitaron a "${grupo.nombre_grupo}"`}>
      <p className="text-sm opacity-70 mb-6">
        grupo {grupo.tipo_grupo}. al unirte empiezas a compartir tu progreso
        físico con el equipo.
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
      <h1 className="syne text-3xl lowercase mb-6">{title}</h1>
      {children}
    </main>
  );
}
