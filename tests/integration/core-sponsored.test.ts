import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const core = createClient(url, key, { db: { schema: "core" as any } });

describe("core sponsored tables", () => {
  it("permite crear brand partner + sponsored trato + reward codes", async () => {
    const { data: brand, error: be } = await core.from("brand_partners").insert({
      nombre: "Test Brand",
      contacto_email: `brand-${Date.now()}@test.com`,
      rfc: "TST123456789",
    }).select().single();
    expect(be).toBeNull();

    const { data: st, error: se } = await core.from("sponsored_tratos").insert({
      brand_id: brand!.id,
      goal_template: "test trato",
      frecuencia: "daily",
      duracion_dias: 30,
      recompensa_descripcion: "20% off",
      recompensa_tipo: "cupon",
      setup_fee_mxn: 30000,
      per_completion_fee_mxn: 50,
      estado: "activo",
      fecha_inicio: new Date().toISOString().slice(0, 10),
    }).select().single();
    expect(se).toBeNull();
    expect(st?.estado).toBe("activo");

    const { error: rce } = await core.from("reward_codes").insert({
      sponsored_trato_id: st!.id,
      codigo: `CODE-${Date.now()}`,
    });
    expect(rce).toBeNull();
  });
});
