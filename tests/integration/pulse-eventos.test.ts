import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const pulse = createClient(url, key, { db: { schema: "pulse" as any } });

describe("pulse.eventos_agregados", () => {
  it("permite insertar evento sin user_id ni trato_id", async () => {
    const { data, error } = await pulse.from("eventos_agregados").insert({
      categoria: "fitness",
      duracion_dias_bucket: "30d",
      tasa_cumplimiento_bucket: "0.8-1.0",
      cohorte_edad: "25-35",
      cohorte_ciudad: "CDMX",
      es_patrocinado: false,
      dow_creacion: 1,
    }).select().single();
    expect(error).toBeNull();
    expect(data?.categoria).toBe("fitness");
    // Verificar que NO existen columnas user_id o trato_id
    expect(Object.keys(data ?? {})).not.toContain("user_id");
    expect(Object.keys(data ?? {})).not.toContain("trato_id");
  });
});
