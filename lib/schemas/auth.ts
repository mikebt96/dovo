import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("email inválido"),
  nombre: z.string()
    .min(2, "mínimo 2 caracteres")
    .max(60, "máximo 60 caracteres"),
});

export const signInSchema = z.object({
  email: z.string().email("email inválido"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
