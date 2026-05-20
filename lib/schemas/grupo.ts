import { z } from "zod";

export const TIPOS_GRUPO = [
  { value: "pareja", label: "Pareja", hint: "2 personas" },
  { value: "pequeno", label: "Grupo pequeño", hint: "3-6 personas" },
  { value: "grande", label: "Grupo grande", hint: "7+ personas" },
] as const;

export const crearGrupoSchema = z.object({
  nombre_grupo: z.string().min(1, "ponle nombre al grupo").max(80),
  tipo_grupo: z.enum(["pareja", "pequeno", "grande"]),
});

export type CrearGrupoInput = z.infer<typeof crearGrupoSchema>;

export const unirseGrupoSchema = z.object({
  token: z.string().min(10),
});

export type UnirseGrupoInput = z.infer<typeof unirseGrupoSchema>;
