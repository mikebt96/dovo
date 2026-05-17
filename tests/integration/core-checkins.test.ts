import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key);
const core = createClient(url, key, { db: { schema: "core" as any } });

async function createUserAndTrato() {
  const c = await admin.auth.admin.createUser({ email: `c-${Date.now()}@dovo.app`, email_confirm: true });
  const p = await admin.auth.admin.createUser({ email: `p-${Date.now()}@dovo.app`, email_confirm: true });
  await core.from("users").insert([
    { id: c.data.user!.id, email: c.data.user!.email, nombre: "C", access_channel: "fcfs" },
    { id: p.data.user!.id, email: p.data.user!.email, nombre: "P", access_channel: "fcfs" },
  ]);
  const { data: trato } = await core.from("tratos").insert({
    creator_id: c.data.user!.id,
    partner_id: p.data.user!.id,
    goal: "test",
    frecuencia: "daily",
    duracion_dias: 7,
    recompensa_text: "x",
    castigo_text: "y",
  }).select().single();
  return { creatorId: c.data.user!.id, partnerId: p.data.user!.id, tratoId: trato!.id };
}

describe("core.checkins", () => {
  it("permite self-report de cumplimiento", async () => {
    const { creatorId, tratoId } = await createUserAndTrato();
    const { data, error } = await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creatorId,
      fecha: new Date().toISOString().slice(0, 10),
      cumplido: true,
    }).select().single();
    expect(error).toBeNull();
    expect(data?.cumplido).toBe(true);
    expect(data?.disputed_by).toBeNull();
  });

  it("permite que el otro miembro dispute con razón", async () => {
    const { creatorId, partnerId, tratoId } = await createUserAndTrato();
    const { data: checkin } = await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creatorId,
      fecha: new Date().toISOString().slice(0, 10),
      cumplido: true,
    }).select().single();

    const { data, error } = await core.from("checkins")
      .update({
        disputed_by: partnerId,
        disputed_reason: "no lo vi en el gym hoy",
        disputed_at: new Date().toISOString(),
      })
      .eq("id", checkin!.id)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.disputed_by).toBe(partnerId);
  });

  it("rechaza disputed_reason muy corto", async () => {
    const { creatorId, partnerId, tratoId } = await createUserAndTrato();
    const { data: checkin } = await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creatorId,
      fecha: new Date().toISOString().slice(0, 10),
      cumplido: true,
    }).select().single();

    const { error } = await core.from("checkins")
      .update({
        disputed_by: partnerId,
        disputed_reason: "no",
        disputed_at: new Date().toISOString(),
      })
      .eq("id", checkin!.id);
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/check constraint|disputed_reason/i);
  });
});
