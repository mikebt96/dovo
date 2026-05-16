"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSlug } from "@/lib/auth/session";
import { generateWeeklyReview } from "@/lib/ai/weekly-review";
import { mondayOf } from "@/lib/dates";

const Input = z.object({
  profile: z.enum(["mike", "andy"]),
  week_start: z.string().date().optional(), // defaults a lunes en curso
});

type Result =
  | { ok: true; week_start: string }
  | { ok: false; error: string };

/**
 * Genera (o regenera) el weekly review para un profile.
 * Se llama desde la UI (botón "Generar") o desde el cron.
 *
 * El cron NO usa esta action directamente — usa generateWeeklyReview
 * pasando ambos profiles. Esta action es para uso interactivo.
 */
export async function generateMyReview(
  input: z.infer<typeof Input>,
): Promise<Result> {
  await requireSlug();

  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input inválido" };
  const data = parsed.data;

  const week_start = data.week_start ?? mondayOf();
  const res = await generateWeeklyReview(data.profile, week_start);
  if (!res.ok) return res;

  revalidatePath(`/${data.profile}/review`);
  return res;
}
