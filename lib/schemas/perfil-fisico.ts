import { z } from "zod";

export const NIVELES_ACTIVIDAD = [
  { value: "sedentario", label: "Sedentario", factor: 1.2 },
  { value: "ligero", label: "Ligero (1-3 días/sem)", factor: 1.375 },
  { value: "moderado", label: "Moderado (3-5 días/sem)", factor: 1.55 },
  { value: "activo", label: "Activo (6-7 días/sem)", factor: 1.725 },
  { value: "muy_activo", label: "Muy activo (2x día)", factor: 1.9 },
] as const;

export const OBJETIVOS = [
  { value: "perder_grasa", label: "Perder grasa" },
  { value: "ganar_musculo", label: "Ganar músculo" },
  { value: "mantener", label: "Mantener" },
  { value: "mejorar_resistencia", label: "Mejorar resistencia" },
] as const;

export const EXPERIENCIAS = [
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
] as const;

export const perfilFisicoSchema = z.object({
  peso_kg: z.number().min(20).max(400),
  altura_cm: z.number().min(80).max(260),
  // 18+: el aviso de privacidad v1.0 fija dovo como servicio para mayores de
  // edad (datos sensibles de salud sin mecanismo de consentimiento parental)
  edad: z.number().int().min(18, "dovo es para mayores de 18 años").max(120),
  genero: z.enum(["masculino", "femenino", "otro"]),
  nivel_actividad: z.enum([
    "sedentario",
    "ligero",
    "moderado",
    "activo",
    "muy_activo",
  ]),
  objetivo: z.enum([
    "perder_grasa",
    "ganar_musculo",
    "mantener",
    "mejorar_resistencia",
  ]),
  // Opcionales (progressive disclosure)
  experiencia: z
    .enum(["principiante", "intermedio", "avanzado"])
    .optional(),
  lesiones: z.array(z.string().max(120)).max(20).optional(),
});

export type PerfilFisicoInput = z.infer<typeof perfilFisicoSchema>;
