import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { FRECUENCIAS } from "@/lib/schemas/trato";
import AcceptButton from "./AcceptButton";

export const metadata = { title: "invitación · dovo" };
export const dynamic = "force-dynamic";

type Trato = {
  id: string;
  creator_id: string;
  partner_id: string | null;
  partner_email: string;
  goal: string;
  frecuencia: string;
  duracion_dias: number;
  recompensa_text: string;
  castigo_text: string;
  estado: "pendiente_aceptacion" | "activo" | "cerrado" | "disputado";
  invite_expires_at: string;
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

  // Token-based lookup usa service_role (bypassa RLS). El token es el
  // credential — quien lo tenga puede ver el trato. RLS no puede expresar
  // "lookup-by-token-only" sin permitir enumeración de todas las filas
  // pendientes, así que el bypass es deliberado.
  const service = createServiceClient();
  const { data: trato } = await service
    .schema("core")
    .from("tratos")
    .select(
      "id, creator_id, partner_id, partner_email, goal, frecuencia, duracion_dias, recompensa_text, castigo_text, estado, invite_expires_at",
    )
    .eq("invite_token", token)
    .maybeSingle<Trato>();

  // Si no encontró (RLS rechazó o no existe), mostrar error
  if (!trato) {
    return <ErrorShell title="invite no existe" />;
  }

  if (new Date(trato.invite_expires_at) < new Date()) {
    return <ErrorShell title="invite expirado" />;
  }

  if (trato.estado !== "pendiente_aceptacion") {
    return (
      <ErrorShell title="trato ya aceptado">
        <p className="text-sm opacity-70 mt-4">
          este trato ya está activo o cerrado.
        </p>
      </ErrorShell>
    );
  }

  const frecuenciaLabel =
    FRECUENCIAS.find((f) => f.value === trato.frecuencia)?.label ?? trato.frecuencia;

  // Caso 1: usuario no autenticado
  if (!user) {
    const nextParam = encodeURIComponent(`/invite/${token}`);
    return (
      <Shell
        title="te invitaron a un trato"
        goal={trato.goal}
        frecuenciaLabel={frecuenciaLabel}
        trato={trato}
      >
        <div className="space-y-4">
          <p className="text-sm opacity-70">
            necesitas una cuenta para aceptar. usa el correo{" "}
            <strong>{trato.partner_email}</strong>.
          </p>
          <Link
            href={`/sign-up?next=${nextParam}`}
            className="block w-full bg-ink text-papel py-3 syne lowercase text-center"
          >
            crear cuenta y aceptar
          </Link>
          <Link
            href={`/sign-in?next=${nextParam}`}
            className="block w-full border border-ink py-3 syne lowercase text-center"
          >
            ya tengo cuenta
          </Link>
        </div>
      </Shell>
    );
  }

  // Caso 2: autenticado pero email no matchea partner_email
  const { data: meRow } = await supabase
    .schema("core")
    .from("users")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const myEmail = (meRow?.email as string | undefined)?.toLowerCase();
  if (myEmail !== trato.partner_email.toLowerCase()) {
    return (
      <Shell
        title="este invite es para alguien más"
        goal={trato.goal}
        frecuenciaLabel={frecuenciaLabel}
        trato={trato}
      >
        <p className="text-sm opacity-70">
          el invite es para <strong>{trato.partner_email}</strong>. tú estás
          como <strong>{meRow?.email}</strong>. cierra sesión y entra con el
          correo correcto.
        </p>
      </Shell>
    );
  }

  // Caso 3: el creator se intentó autoinvitar
  if (trato.creator_id === user.id) {
    return (
      <ErrorShell title="no puedes aceptar tu propio trato" />
    );
  }

  // Caso happy: muestra aceptar
  return (
    <Shell
      title="te invitaron a un trato"
      goal={trato.goal}
      frecuenciaLabel={frecuenciaLabel}
      trato={trato}
    >
      <AcceptButton token={token} tratoId={trato.id} />
    </Shell>
  );
}

function Shell({
  title,
  goal,
  frecuenciaLabel,
  trato,
  children,
}: {
  title: string;
  goal: string;
  frecuenciaLabel: string;
  trato: Pick<
    Trato,
    "duracion_dias" | "recompensa_text" | "castigo_text" | "partner_email"
  >;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-svh max-w-xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-10">
        <Link
          href="/"
          className="syne text-2xl lowercase tracking-tight inline-block mb-8"
        >
          dovo
        </Link>
        <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
          {title}
        </p>
        <h1 className="syne text-3xl lowercase">{goal}</h1>
      </header>

      <section className="space-y-5 text-sm border-t border-b border-ink py-8 mb-10">
        <Row label="Cadencia" value={`${frecuenciaLabel} · ${trato.duracion_dias} días`} />
        <Row label="Recompensa" value={trato.recompensa_text} />
        <Row label="Castigo" value={trato.castigo_text} />
      </section>

      {children}
    </main>
  );
}

function ErrorShell({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-svh max-w-xl mx-auto px-6 py-12 bg-papel text-ink flex flex-col items-center justify-center text-center">
      <Link href="/" className="syne text-2xl lowercase tracking-tight mb-8">
        dovo
      </Link>
      <h1 className="syne text-3xl lowercase">{title}</h1>
      {children}
      <Link
        href="/"
        className="mt-8 text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
      >
        ← inicio
      </Link>
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
