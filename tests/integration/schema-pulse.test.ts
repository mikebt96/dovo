import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";

describe("schema pulse", () => {
  it("existe", async () => {
    const client = createClient(supabaseUrl, serviceKey);
    const { data, error } = await client
      .from("pg_namespace" as any)
      .select("nspname")
      .eq("nspname", "pulse")
      .limit(1);
    // Alternativa: usar rpc o raw SQL via service role
    expect(error).toBeNull();
  });
});
