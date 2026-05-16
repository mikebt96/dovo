"use server";

import "server-only";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { slugToUuid } from "@/lib/profileServer";
import { requireSlug } from "@/lib/auth/session";

/**
 * Server Action canónica para los 3 tipos de check del Carnet.
 * Cada tipo persiste en su tabla; la unicidad la maneja la DB con
 * los UNIQUE constraints definidos en schema.sql.
 *
 * Dual-write con CheckList: el client escribe localStorage (optimistic,
 * caché de UI) Y llama a este action en paralelo. Si el server falla,
 * NO revertimos localStorage — el usuario ve su trabajo. El re-sync
 * server→local queda como deuda explícita.
 */

const ToggleInput = z.discriminatedUnion("table", [
  z.object({
    table: z.literal("meals_log"),
    profile: z.enum(["mike", "andy"]),
    key: z.string().min(1).max(50),       // meal_id, ej 'lun-mk-1'
    date: z.string().date(),               // YYYY-MM-DD
    checked: z.boolean(),
  }),
  z.object({
    table: z.literal("shopping_check"),
    profile: z.enum(["mike", "andy"]),
    key: z.string().min(1).max(50),       // item_id
    week_start: z.string().date(),         // monday YYYY-MM-DD
    checked: z.boolean(),
  }),
  z.object({
    table: z.literal("prep_check"),
    profile: z.enum(["mike", "andy"]),
    key: z.string().min(1).max(50),       // task_id
    week_start: z.string().date(),
    checked: z.boolean(),
  }),
]);

export type ToggleInput = z.infer<typeof ToggleInput>;
export type ToggleResult = { ok: true } | { ok: false; error: string };

export async function toggleCheck(input: ToggleInput): Promise<ToggleResult> {
  await requireSlug();

  const parsed = ToggleInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input inválido" };
  }
  const data = parsed.data;

  const profile_id = await slugToUuid(data.profile);
  if (!profile_id) return { ok: false, error: "Perfil no encontrado" };

  const sb = getServerSupabase();

  if (data.checked) {
    // INSERT idempotente (upsert con onConflict)
    if (data.table === "meals_log") {
      const { error } = await sb
        .from("meals_log")
        .upsert(
          { profile_id, date: data.date, meal_id: data.key, completed: true },
          { onConflict: "profile_id,date,meal_id" },
        );
      if (error) return { ok: false, error: error.message };
    } else if (data.table === "shopping_check") {
      const { error } = await sb
        .from("shopping_check")
        .upsert(
          { profile_id, week_start: data.week_start, item_id: data.key },
          { onConflict: "profile_id,week_start,item_id" },
        );
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await sb
        .from("prep_check")
        .upsert(
          { profile_id, week_start: data.week_start, task_id: data.key },
          { onConflict: "profile_id,week_start,task_id" },
        );
      if (error) return { ok: false, error: error.message };
    }
  } else {
    // DELETE
    if (data.table === "meals_log") {
      const { error } = await sb
        .from("meals_log")
        .delete()
        .eq("profile_id", profile_id)
        .eq("date", data.date)
        .eq("meal_id", data.key);
      if (error) return { ok: false, error: error.message };
    } else if (data.table === "shopping_check") {
      const { error } = await sb
        .from("shopping_check")
        .delete()
        .eq("profile_id", profile_id)
        .eq("week_start", data.week_start)
        .eq("item_id", data.key);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await sb
        .from("prep_check")
        .delete()
        .eq("profile_id", profile_id)
        .eq("week_start", data.week_start)
        .eq("task_id", data.key);
      if (error) return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}
