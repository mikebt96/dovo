import { z } from "zod";

// Un item de rutina: una actividad del catálogo + cuántas veces por semana
// + cuántos minutos por sesión.
export const rutinaItemSchema = z.object({
  actividad_id: z.string().uuid(),
  frecuencia_semanal: z.number().int().min(1).max(14),
  duracion_min: z.number().int().min(5).max(300),
});

export const rutinaSchema = z.object({
  miembro_id: z.string().uuid(),
  nombre: z.string().min(1).max(60),
  is_default: z.boolean().default(true),
  is_travel: z.boolean().default(false),
  actividades: z.array(rutinaItemSchema).min(1, "agrega al menos una actividad"),
});

export type RutinaInput = z.infer<typeof rutinaSchema>;
export type RutinaItem = z.infer<typeof rutinaItemSchema>;
