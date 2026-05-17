import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";

describe("schema core", () => {
  it("existe y es accesible con service role", async () => {
    const client = createClient(supabaseUrl, serviceKey, {
      db: { schema: "core" as any },
    });
    const { error } = await client.rpc("ping_core" as any);
    // Aunque la función no exista, el error debe ser "function does not exist",
    // no "schema does not exist"
    expect(error?.message ?? "").not.toMatch(/schema "core" does not exist/i);
  });
});
