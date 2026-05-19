import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const skip = !key;

// Lazy: solo instanciar si hay key, así describe.skipIf no truena en module load.
const admin = skip ? (null as any) : createClient(url, key);
const core = skip
  ? (null as any)
  : createClient(url, key, { db: { schema: "core" as any } });

async function createTestUser(suffix: string): Promise<{ id: string; email: string }> {
  const email = `chk${suffix}-${Date.now()}@dovo.app`;
  const { data } = await admin.auth.admin.createUser({ email, email_confirm: true });
  const id = data.user!.id;
  await core.from("users").insert({
    id,
    email,
    nombre: `User ${suffix}`,
    access_channel: "fcfs",
  });
  return { id, email };
}

async function createActivoTrato(
  creator: { id: string; email: string },
  partner: { id: string; email: string },
  opts: { duracion_dias?: number; accepted_at?: Date } = {},
): Promise<string> {
  const acceptedAt = opts.accepted_at ?? new Date();
  const { data } = await core
    .from("tratos")
    .insert({
      creator_id: creator.id,
      partner_id: partner.id,
      partner_email: partner.email,
      goal: "test goal",
      frecuencia: "daily",
      duracion_dias: opts.duracion_dias ?? 7,
      recompensa_text: "recompensa test",
      castigo_text: "castigo test",
      estado: "activo",
      accepted_at: acceptedAt.toISOString(),
    })
    .select("id")
    .single();
  return data!.id as string;
}

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

describe.skipIf(skip)("checkins flow", () => {
  it("user puede crear su checkin de hoy", async () => {
    const creator = await createTestUser("c1");
    const partner = await createTestUser("p1");
    const tratoId = await createActivoTrato(creator, partner);

    const { data, error } = await core
      .from("checkins")
      .insert({
        trato_id: tratoId,
        user_id: creator.id,
        fecha: todayIso(),
        cumplido: true,
        nota: "hecho",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.cumplido).toBe(true);
    expect(data?.disputed_at).toBeNull();
  });

  it("constraint unique impide dos checkins del mismo user para la misma fecha", async () => {
    const creator = await createTestUser("c2");
    const partner = await createTestUser("p2");
    const tratoId = await createActivoTrato(creator, partner);
    const today = todayIso();

    await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creator.id,
      fecha: today,
      cumplido: true,
    });

    const { error } = await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creator.id,
      fecha: today,
      cumplido: false,
    });

    expect(error).toBeTruthy();
    expect(error?.code).toBe("23505"); // unique violation
  });

  it("dispute_complete constraint: si hay disputed_by, requiere reason + at", async () => {
    const creator = await createTestUser("c3");
    const partner = await createTestUser("p3");
    const tratoId = await createActivoTrato(creator, partner);

    const { data: checkin } = await core
      .from("checkins")
      .insert({
        trato_id: tratoId,
        user_id: creator.id,
        fecha: todayIso(),
        cumplido: true,
      })
      .select()
      .single();

    // Intentar dispute incompleto debe fallar
    const { error: incompleteErr } = await core
      .from("checkins")
      .update({ disputed_by: partner.id })
      .eq("id", checkin!.id);
    expect(incompleteErr).toBeTruthy();

    // Dispute completo funciona
    const { error: okErr } = await core
      .from("checkins")
      .update({
        disputed_by: partner.id,
        disputed_reason: "no fue cierto, lo vi viendo netflix",
        disputed_at: new Date().toISOString(),
      })
      .eq("id", checkin!.id);
    expect(okErr).toBeNull();
  });

  it("cierre con creator_cumplio=true partner_cumplio=false dispara trigger y bumpea scores", async () => {
    const creator = await createTestUser("c4");
    const partner = await createTestUser("p4");
    const tratoId = await createActivoTrato(creator, partner, {
      duracion_dias: 2,
      accepted_at: new Date(Date.now() - 3 * 86400000),
    });

    // Scores iniciales
    const { data: before } = await core
      .from("user_scores")
      .select("user_id, tratos_cerrados, tratos_cumplidos")
      .in("user_id", [creator.id, partner.id]);
    expect(before?.length ?? 0).toBe(0);

    // Simular cierre
    const { error } = await core
      .from("tratos")
      .update({
        estado: "cerrado",
        closed_at: new Date().toISOString(),
        resultado: "uno_fallo",
        creator_cumplio: true,
        partner_cumplio: false,
      })
      .eq("id", tratoId);
    expect(error).toBeNull();

    // Verify trigger creó rows en user_scores
    const { data: after } = await core
      .from("user_scores")
      .select("user_id, tratos_cerrados, tratos_cumplidos, score_publico")
      .in("user_id", [creator.id, partner.id]);

    const byUser = Object.fromEntries((after ?? []).map((r: any) => [r.user_id, r]));
    expect(byUser[creator.id]?.tratos_cerrados).toBe(1);
    expect(byUser[creator.id]?.tratos_cumplidos).toBe(1);
    expect(byUser[creator.id]?.score_publico).toBe(1000);
    expect(byUser[partner.id]?.tratos_cerrados).toBe(1);
    expect(byUser[partner.id]?.tratos_cumplidos).toBe(0);
    expect(byUser[partner.id]?.score_publico).toBe(0);
  });

  it("cierre con ambos_cumplieron bumpea ambos a 1/1", async () => {
    const creator = await createTestUser("c5");
    const partner = await createTestUser("p5");
    const tratoId = await createActivoTrato(creator, partner, {
      duracion_dias: 1,
      accepted_at: new Date(Date.now() - 2 * 86400000),
    });

    await core
      .from("tratos")
      .update({
        estado: "cerrado",
        closed_at: new Date().toISOString(),
        resultado: "ambos_cumplieron",
        creator_cumplio: true,
        partner_cumplio: true,
      })
      .eq("id", tratoId);

    const { data } = await core
      .from("user_scores")
      .select("user_id, tratos_cumplidos, score_publico")
      .in("user_id", [creator.id, partner.id]);

    const byUser = Object.fromEntries((data ?? []).map((r: any) => [r.user_id, r]));
    expect(byUser[creator.id]?.tratos_cumplidos).toBe(1);
    expect(byUser[creator.id]?.score_publico).toBe(1000);
    expect(byUser[partner.id]?.tratos_cumplidos).toBe(1);
    expect(byUser[partner.id]?.score_publico).toBe(1000);
  });

  it("doble cierre no double-bumpea (trigger filtra por estado distinct from cerrado)", async () => {
    const creator = await createTestUser("c6");
    const partner = await createTestUser("p6");
    const tratoId = await createActivoTrato(creator, partner, {
      duracion_dias: 1,
      accepted_at: new Date(Date.now() - 2 * 86400000),
    });

    await core
      .from("tratos")
      .update({
        estado: "cerrado",
        closed_at: new Date().toISOString(),
        resultado: "ambos_cumplieron",
        creator_cumplio: true,
        partner_cumplio: true,
      })
      .eq("id", tratoId);

    // Segundo UPDATE de estado='cerrado' a 'cerrado' — trigger debe ser no-op
    await core
      .from("tratos")
      .update({
        estado: "cerrado",
        partner_cumplio: false, // intenta cambiar resultado
      })
      .eq("id", tratoId);

    const { data } = await core
      .from("user_scores")
      .select("user_id, tratos_cerrados")
      .in("user_id", [creator.id, partner.id]);

    const byUser = Object.fromEntries((data ?? []).map((r: any) => [r.user_id, r]));
    expect(byUser[creator.id]?.tratos_cerrados).toBe(1);
    expect(byUser[partner.id]?.tratos_cerrados).toBe(1);
  });
});
