import { z } from "zod";

export const createCheckinSchema = z.object({
  trato_id: z.string().uuid(),
  cumplido: z.boolean(),
  nota: z.string().max(280).optional(),
});

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;

export const disputeCheckinSchema = z.object({
  checkin_id: z.string().uuid(),
  reason: z
    .string()
    .min(10, "explica brevemente (mínimo 10 caracteres)")
    .max(280, "máximo 280 caracteres"),
});

export type DisputeCheckinInput = z.infer<typeof disputeCheckinSchema>;
