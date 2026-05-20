import { z } from "zod";

export const optOutSchema = z.object({
  opt_out: z.boolean(),
});

export type OptOutInput = z.infer<typeof optOutSchema>;
