import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key);
const core = createClient(url, key, { db: { schema: "core" as any } });

describe("core.user_scores", () => {
  it("se crea con default hidden", async () => {
    const { data: auth } = await admin.auth.admin.createUser({
      email: `s-${Date.now()}@dovo.app`,
      email_confirm: true,
    });
    await core.from("users").insert({
      id: auth.user!.id,
      email: auth.user!.email,
      nombre: "S",
      access_channel: "fcfs",
    });

    const { data, error } = await core.from("user_scores").insert({
      user_id: auth.user!.id,
    }).select().single();

    expect(error).toBeNull();
    expect(data?.visibility).toBe("hidden");
    expect(data?.tratos_cerrados).toBe(0);
    expect(data?.tratos_cumplidos).toBe(0);
  });

  it("rechaza visibility inválido", async () => {
    const { data: auth } = await admin.auth.admin.createUser({
      email: `s2-${Date.now()}@dovo.app`,
      email_confirm: true,
    });
    await core.from("users").insert({
      id: auth.user!.id,
      email: auth.user!.email,
      nombre: "S",
      access_channel: "fcfs",
    });

    const { error } = await core.from("user_scores").insert({
      user_id: auth.user!.id,
      visibility: "invalid_value" as any,
    });
    expect(error).toBeTruthy();
  });
});
