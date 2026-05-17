import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

describe("core.users", () => {
  it("permite insertar usuario después de crear auth user", async () => {
    const email = `test-${Date.now()}@dovo.app`;
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    const coreClient = createClient(url, key, { db: { schema: "core" as any } });
    const { data, error } = await coreClient
      .from("users")
      .insert({
        id: authData.user!.id,
        email,
        nombre: "Test User",
        access_channel: "fcfs",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.email).toBe(email);
    expect(data?.pulse_opt_out).toBe(false);

    // cleanup
    await admin.auth.admin.deleteUser(authData.user!.id);
  });
});
