import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FRECUENCIAS } from "@/lib/schemas/trato";
import { publicEnv } from "@/lib/env";
import {
  dayStates,
  diasRequeridos,
  countCumplidos,
  streakActual,
  isPastDuration,
  todayMx,
  type Frecuencia,
} from "@/lib/utils/streak";
import { resolveTrato } from "@/lib/actions/resolveTrato";
import InviteLink from "./InviteLink";
import StreakGrid from "./_components/StreakGrid";
import CheckinForm from "./_components/CheckinForm";
import PartnerDisputeUI from "./_components/PartnerDisputeUI";

export const metadata = { title: "trato · dovo" };
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
  resultado: string | null;
  creator_cumplio: boolean | null;
  partner_cumplio: boolean | null;
  invite_token: string;
  invite_expires_at: string;
  created_at: string;
  accepted_at: string | null;
  closed_at: string | null;
};

type Checkin = {
  id: string;
  user_id: string;
  fecha: string;
  cumplido: boolean;
  nota: string | null;
  disputed_at: string | null;
  disputed_by: string | null;
  disputed_reason: string | null;
};

const TRATO_COLS =
  "id, creator_id, partner_id, partner_email, goal, frecuencia, duracion_dias, recompensa_text, castigo_text, estado, resultado, creator_cumplio, partner_cumplio, invite_token, invite_expires_at, created_at, accepted_at, closed_at";

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

  let { data: trato } = await supabase
    .schema("core")
    .from("tratos")
    .select(TRATO_COLS)
    .eq("id", id)
    .maybeSingle<Trato>();

  if (!trato) notFound();

  const isCreator = trato.creator_id === user.id;
  const isPartner = trato.partner_id === user.id;
  if (!isCreator && !isPartner) notFound();

  // Lazy resolution: si el período expiró y aún está activo, cerrar ahora.
  if (
    trato.estado === "activo" &&
    trato.accepted_at &&
    isPastDuration(trato.accepted_at, trato.duracion_dias)
  ) {
    await resolveTrato(id);
    const { data: refreshed } = await supabase
      .schema("core")
      .from("tratos")
      .select(TRATO_COLS)
      .eq("id", id)
      .maybeSingle<Trato>();
    if (refreshed) trato = refreshed;
  }

  const frecuenciaLabel =
    FRECUENCIAS.find((f) => f.value === trato.frecuencia)?.label ??
    trato.frecuencia;
  const inviteUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/invite/${trato.invite_token}`;

  let checkins: Checkin[] = [];
  if (trato.estado === "activo" || trato.estado === "cerrado") {
    const { data } = await supabase
      .schema("core")
      .from("checkins")
      .select(
        "id, user_id, fecha, cumplido, nota, disputed_at, disputed_by, disputed_reason",
      )
      .eq("trato_id", id);
    checkins = (data as Checkin[] | null) ?? [];
  }

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
        <Row
          label="Cadencia"
          value={`${frecuenciaLabel} · ${trato.duracion_dias} días`}
        />
        <Row label="Recompensa" value={trato.recompensa_text} />
        <Row label="Castigo" value={trato.castigo_text} />
        {trato.estado !== "cerrado" && (
          <Row
            label="Partner"
            value={
              trato.estado === "pendiente_aceptacion"
                ? `${trato.partner_email} (esperando que acepte)`
                : trato.partner_email
            }
          />
        )}
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

      {trato.estado === "activo" && trato.accepted_at && (
        <ActivoView trato={trato} checkins={checkins} isCreator={isCreator} />
      )}

      {trato.estado === "cerrado" && trato.accepted_at && (
        <CerradoView trato={trato} checkins={checkins} isCreator={isCreator} />
      )}
    </main>
  );
}

function ActivoView({
  trato,
  checkins,
  isCreator,
}: {
  trato: Trato;
  checkins: Checkin[];
  isCreator: boolean;
}) {
  const userId = isCreator ? trato.creator_id : trato.partner_id!;
  const partnerId = isCreator ? trato.partner_id! : trato.creator_id;

  const myCheckins = checkins
    .filter((c) => c.user_id === userId)
    .map((c) => ({
      fecha: c.fecha,
      cumplido: c.cumplido,
      disputed_at: c.disputed_at,
    }));
  const partnerCheckins = checkins
    .filter((c) => c.user_id === partnerId)
    .map((c) => ({
      fecha: c.fecha,
      cumplido: c.cumplido,
      disputed_at: c.disputed_at,
    }));

  const myStates = dayStates(
    trato.accepted_at!,
    trato.duracion_dias,
    myCheckins,
  );
  const partnerStates = dayStates(
    trato.accepted_at!,
    trato.duracion_dias,
    partnerCheckins,
  );

  const required = diasRequeridos(
    trato.frecuencia as Frecuencia,
    trato.duracion_dias,
    trato.accepted_at!,
  );

  const myStreak = streakActual(myStates);
  const myDone = countCumplidos(myStates);

  const today = todayMx();
  const todayCheckin = checkins.find(
    (c) => c.user_id === userId && c.fecha === today,
  );

  const partnerDisputables = checkins
    .filter(
      (c) => c.user_id === partnerId && c.cumplido && !c.disputed_at,
    )
    .map((c) => ({ id: c.id, fecha: c.fecha, nota: c.nota }))
    .sort((a, b) => (a.fecha > b.fecha ? -1 : 1));

  return (
    <>
      <section className="mt-12 pt-8 border-t border-ink space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="syne text-xl lowercase">tu progreso</h2>
          <p className="text-xs uppercase tracking-widest opacity-60">
            racha {myStreak} · {myDone}/{required}
          </p>
        </div>
        <StreakGrid days={myStates} label="tus días" />
      </section>

      <section className="mt-8">
        <CheckinForm
          tratoId={trato.id}
          existing={
            todayCheckin
              ? { cumplido: todayCheckin.cumplido, nota: todayCheckin.nota }
              : null
          }
        />
      </section>

      <section className="mt-12 pt-8 border-t border-ink space-y-6">
        <h2 className="syne text-xl lowercase">{trato.partner_email}</h2>
        <StreakGrid days={partnerStates} label="sus días" />
        {partnerDisputables.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
              marcar disputa
            </p>
            <PartnerDisputeUI
              items={partnerDisputables}
              partnerName={trato.partner_email}
            />
          </div>
        )}
      </section>
    </>
  );
}

function CerradoView({
  trato,
  checkins,
  isCreator,
}: {
  trato: Trato;
  checkins: Checkin[];
  isCreator: boolean;
}) {
  const userId = isCreator ? trato.creator_id : trato.partner_id!;
  const partnerId = isCreator ? trato.partner_id! : trato.creator_id;
  const userCumplio = isCreator ? trato.creator_cumplio : trato.partner_cumplio;
  const partnerCumplio = isCreator
    ? trato.partner_cumplio
    : trato.creator_cumplio;

  const myCheckins = checkins
    .filter((c) => c.user_id === userId)
    .map((c) => ({
      fecha: c.fecha,
      cumplido: c.cumplido,
      disputed_at: c.disputed_at,
    }));
  const partnerCheckins = checkins
    .filter((c) => c.user_id === partnerId)
    .map((c) => ({
      fecha: c.fecha,
      cumplido: c.cumplido,
      disputed_at: c.disputed_at,
    }));

  const myStates = dayStates(
    trato.accepted_at!,
    trato.duracion_dias,
    myCheckins,
  );
  const partnerStates = dayStates(
    trato.accepted_at!,
    trato.duracion_dias,
    partnerCheckins,
  );

  const resultadoLabel = resultLabel(
    trato.resultado,
    userCumplio,
    partnerCumplio,
    trato.partner_email,
  );

  return (
    <section className="mt-12 pt-8 border-t border-ink space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
          resultado
        </p>
        <h2 className="syne text-3xl lowercase">{resultadoLabel.headline}</h2>
        <p className="text-sm opacity-70 mt-2">{resultadoLabel.subline}</p>
      </div>

      <StreakGrid days={myStates} label="tus días" />
      <StreakGrid
        days={partnerStates}
        label={`días de ${trato.partner_email}`}
      />
    </section>
  );
}

function resultLabel(
  resultado: string | null,
  userCumplio: boolean | null,
  partnerCumplio: boolean | null,
  partnerEmail: string,
): { headline: string; subline: string } {
  switch (resultado) {
    case "ambos_cumplieron":
      return {
        headline: "los dos cumplieron",
        subline: "denle gusto a la recompensa.",
      };
    case "ambos_fallaron":
      return {
        headline: "ninguno cumplió",
        subline: "los dos pagan el castigo.",
      };
    case "uno_fallo":
      if (userCumplio && !partnerCumplio) {
        return {
          headline: "tú cumpliste",
          subline: `${partnerEmail} falló · te toca la recompensa.`,
        };
      }
      return {
        headline: `${partnerEmail} cumplió`,
        subline: "tú fallaste · te toca el castigo.",
      };
    case "sin_resolver":
      return {
        headline: "quedó sin resolver",
        subline: "hubo disputas. ese tema se arregla afuera de la app.",
      };
    default:
      return { headline: resultado ?? "cerrado", subline: "" };
  }
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
