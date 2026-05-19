import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const skip = !key;

const admin = skip ? (null as any) : createClient(url, key);
const core = skip
  ? (null as any)
  : createClient(url, key, { db: { schema: "core" as any } });

async function createTestUser(suffix: string): Promise<{ id: string; email: string }> {
  const email = `t${suffix}-${Date.now()}@dovo.app`;
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

describe.skipIf(skip)("tratos flow", () => {
  it("crea trato pendiente con partner_email + invite_token", async () => {
    const creator = await createTestUser("c");

    const { data, error } = await core
      .from("tratos")
      .insert({
        creator_id: creator.id,
        partner_email: `partner-${Date.now()}@dovo.app`,
        goal: "ir al gym 3 veces por semana",
        frecuencia: "3x_per_week",
        duracion_dias: 56,
        recompensa_text: "el que cumpla elige la peli",
        castigo_text: "el que falle paga el café",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.estado).toBe("pendiente_aceptacion");
    expect(data?.partner_id).toBeNull();
    expect(data?.invite_token).toBeTruthy();
    expect((data?.invite_token as string).length).toBeGreaterThan(20);
  });

  it("rechaza trato consigo mismo (creator_id == partner_id seteado)", async () => {
    const u = await createTestUser("self");

    const { error } = await core.from("tratos").insert({
      creator_id: u.id,
      partner_id: u.id,
      partner_email: u.email,
      goal: "consigo mismo",
      frecuencia: "daily",
      duracion_dias: 7,
      recompensa_text: "x",
      castigo_text: "y",
    });

    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/check constraint|creator.*partner/i);
  });

  it("acepta trato: partner_id se llena y estado pasa a activo", async () => {
    const creator = await createTestUser("creator");
    const partner = await createTestUser("partner");

    const { data: trato } = await core
      .from("tratos")
      .insert({
        creator_id: creator.id,
        partner_email: partner.email,
        goal: "test trato",
        frecuencia: "daily",
        duracion_dias: 21,
        recompensa_text: "x",
        castigo_text: "y",
      })
      .select()
      .single();

    expect(trato?.estado).toBe("pendiente_aceptacion");

    // Simular accept directo (los actions hacen esto via auth.uid match)
    const { data: updated, error } = await core
      .from("tratos")
      .update({
        partner_id: partner.id,
        estado: "activo",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", trato!.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated?.estado).toBe("activo");
    expect(updated?.partner_id).toBe(partner.id);
  });

  it("invite_token es único entre tratos", async () => {
    const c1 = await createTestUser("u1");
    const c2 = await createTestUser("u2");

    const { data: t1 } = await core
      .from("tratos")
      .insert({
        creator_id: c1.id,
        partner_email: `p1-${Date.now()}@dovo.app`,
        goal: "trato uno",
        frecuencia: "daily",
        duracion_dias: 7,
        recompensa_text: "x",
        castigo_text: "y",
      })
      .select()
      .single();

    const { data: t2 } = await core
      .from("tratos")
      .insert({
        creator_id: c2.id,
        partner_email: `p2-${Date.now()}@dovo.app`,
        goal: "trato dos",
        frecuencia: "daily",
        duracion_dias: 7,
        recompensa_text: "x",
        castigo_text: "y",
      })
      .select()
      .single();

    expect(t1?.invite_token).not.toBe(t2?.invite_token);
  });
});
