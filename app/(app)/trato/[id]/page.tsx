import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FRECUENCIAS } from "@/lib/schemas/trato";
import { publicEnv } from "@/lib/env";
import InviteLink from "./InviteLink";

export const metadata = { title: "trato · dovo" };

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
  resultado: string | null;
  invite_token: string;
  invite_expires_at: string;
  created_at: string;
  accepted_at: string | null;
};

export default async function TratoPage({
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

  const { data: trato } = await supabase
    .schema("core")
    .from("tratos")
    .select(
      "id, creator_id, partner_id, partner_email, goal, frecuencia, duracion_dias, recompensa_text, castigo_text, estado, resultado, invite_token, invite_expires_at, created_at, accepted_at",
    )
    .eq("id", id)
    .maybeSingle<Trato>();

  if (!trato) notFound();

  const isCreator = trato.creator_id === user.id;
  const isPartner = trato.partner_id === user.id;
  if (!isCreator && !isPartner) {
    // RLS debería filtrar antes de llegar aquí, pero por defense in depth
    notFound();
  }

  const frecuenciaLabel =
    FRECUENCIAS.find((f) => f.value === trato.frecuencia)?.label ?? trato.frecuencia;
  const inviteUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/invite/${trato.invite_token}`;

  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
            {estadoLabel(trato.estado)}
          </p>
          <h1 className="syne text-3xl lowercase">{trato.goal}</h1>
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          ← inicio
        </Link>
      </header>

      <section className="space-y-6 text-sm">
        <Row label="Cadencia" value={`${frecuenciaLabel} · ${trato.duracion_dias} días`} />
        <Row label="Recompensa" value={trato.recompensa_text} />
        <Row label="Castigo" value={trato.castigo_text} />
        <Row
          label="Partner"
          value={
            trato.estado === "pendiente_aceptacion"
              ? `${trato.partner_email} (esperando que acepte)`
              : trato.partner_email
          }
        />
      </section>

      {trato.estado === "pendiente_aceptacion" && isCreator && (
        <section className="mt-12 pt-8 border-t border-ink">
          <h2 className="syne text-xl lowercase mb-3">manda el link</h2>
          <p className="text-sm opacity-70 mb-6">
            copia este link y mándaselo al otro por WhatsApp / iMessage / lo que
            sea. expira en{" "}
            {Math.max(
              0,
              Math.ceil(
                (new Date(trato.invite_expires_at).getTime() - Date.now()) /
                  86400000,
              ),
            )}{" "}
            días.
          </p>
          <InviteLink url={inviteUrl} />
        </section>
      )}

      {trato.estado === "pendiente_aceptacion" && isPartner && (
        <p className="mt-12 text-sm opacity-70">
          este trato te lo mandó alguien y ya lo aceptaste. espera al creator
          para que arranque.
        </p>
      )}

      {trato.estado === "activo" && (
        <section className="mt-12 pt-8 border-t border-ink">
          <h2 className="syne text-xl lowercase mb-3">activo</h2>
          <p className="text-sm opacity-70">
            check-ins diarios llegan en el siguiente plan. por ahora, el trato
            está vivo entre los dos.
          </p>
        </section>
      )}

      {(trato.estado === "cerrado" || trato.estado === "disputado") && (
        <section className="mt-12 pt-8 border-t border-ink">
          <h2 className="syne text-xl lowercase mb-3">
            {trato.estado === "disputado" ? "disputado" : "cerrado"}
          </h2>
          {trato.resultado && (
            <p className="text-sm">resultado: {trato.resultado}</p>
          )}
        </section>
      )}
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

function estadoLabel(estado: Trato["estado"]): string {
  switch (estado) {
    case "pendiente_aceptacion":
      return "esperando aceptación";
    case "activo":
      return "activo";
    case "cerrado":
      return "cerrado";
    case "disputado":
      return "disputado";
  }
}
