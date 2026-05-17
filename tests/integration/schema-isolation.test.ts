import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const pulseRoleKey = process.env.SUPABASE_LOCAL_PULSE_KEY;

describe("schema isolation core <-> pulse", () => {
  it("pulse_writer role NO puede leer core.users", async () => {
    if (!pulseRoleKey) {
      console.warn("SUPABASE_LOCAL_PULSE_KEY no seteada — skipping");
      return;
    }
    const pulseClient = createClient(url, pulseRoleKey, {
      db: { schema: "core" as any },
    });
    const { data, error } = await pulseClient
      .from("users")
      .select("id")
      .limit(1);
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/permission denied|not found|does not exist/i);
  });

  it("pulse_writer role NO puede leer core.tratos", async () => {
    if (!pulseRoleKey) return;
    const pulseClient = createClient(url, pulseRoleKey, {
      db: { schema: "core" as any },
    });
    const { error } = await pulseClient.from("tratos").select("id").limit(1);
    expect(error).toBeTruthy();
  });

  it("pulse_writer role SÍ puede insertar en pulse.eventos_agregados", async () => {
    if (!pulseRoleKey) return;
    const pulseClient = createClient(url, pulseRoleKey, {
      db: { schema: "pulse" as any },
    });
    const { error } = await pulseClient.from("eventos_agregados").insert({
      categoria: "fitness",
      duracion_dias_bucket: "30-60d",
      tasa_cumplimiento_bucket: "0.8-1.0",
      cohorte_edad: "25-35",
      cohorte_ciudad: "CDMX",
      es_patrocinado: false,
      dow_creacion: 3,
    });
    expect(error).toBeNull();
  });
});
