import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key);

async function createTestUser(emailSuffix: string) {
  const { data } = await admin.auth.admin.createUser({
    email: `t${emailSuffix}-${Date.now()}@dovo.app`,
    email_confirm: true,
  });
  const id = data.user!.id;
  const core = createClient(url, key, { db: { schema: "core" as any } });
  await core.from("users").insert({
    id,
    email: data.user!.email,
    nombre: `User ${emailSuffix}`,
    access_channel: "fcfs",
  });
  return id;
}

describe("core.tratos", () => {
  it("permite crear trato pendiente entre dos usuarios", async () => {
    const creatorId = await createTestUser("c");
    const partnerId = await createTestUser("p");

    const core = createClient(url, key, { db: { schema: "core" as any } });
    const { data, error } = await core
      .from("tratos")
      .insert({
        creator_id: creatorId,
        partner_id: partnerId,
        goal: "gym 3 veces por semana",
        frecuencia: "3x_per_week",
        duracion_dias: 56,
        recompensa_text: "el que cumpla elige la peli",
        castigo_text: "el que falle paga el café",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.estado).toBe("pendiente_aceptacion");
    expect(data?.creator_id).toBe(creatorId);
  });

  it("rechaza trato consigo mismo (creator == partner)", async () => {
    const userId = await createTestUser("self");
    const core = createClient(url, key, { db: { schema: "core" as any } });
    const { error } = await core
      .from("tratos")
      .insert({
        creator_id: userId,
        partner_id: userId,
        goal: "consigo mismo",
        frecuencia: "daily",
        duracion_dias: 7,
        recompensa_text: "x",
        castigo_text: "y",
      });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/check constraint|creator.*partner/i);
  });
});
