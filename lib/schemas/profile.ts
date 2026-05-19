import { z } from "zod";

export const visibilitySchema = z.object({
  visibility: z.enum(["hidden", "duos_con_trato", "publico"]),
});

export type VisibilityInput = z.infer<typeof visibilitySchema>;

export const optOutSchema = z.object({
  opt_out: z.boolean(),
});

export type OptOutInput = z.infer<typeof optOutSchema>;
