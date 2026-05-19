import { z } from "zod";

const FRECUENCIA_VALUES = ["daily", "weekdays", "3x_per_week", "weekly"] as const;

export const FRECUENCIAS: { value: (typeof FRECUENCIA_VALUES)[number]; label: string }[] = [
  { value: "daily", label: "Cada día" },
  { value: "weekdays", label: "Lunes a viernes" },
  { value: "3x_per_week", label: "3 veces por semana" },
  { value: "weekly", label: "1 vez por semana" },
];

export const createTratoSchema = z.object({
  goal: z.string().min(3, "mínimo 3 caracteres").max(500),
  frecuencia: z.enum(FRECUENCIA_VALUES),
  duracion_dias: z.number().int().min(1).max(365),
  recompensa_text: z.string().min(1).max(500),
  castigo_text: z.string().min(1).max(500),
  partner_email: z.string().email("email inválido"),
});

export type CreateTratoInput = z.infer<typeof createTratoSchema>;

export const acceptTratoSchema = z.object({
  token: z.string().min(10),
});

export type AcceptTratoInput = z.infer<typeof acceptTratoSchema>;
