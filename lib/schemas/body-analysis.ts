import { z } from "zod";

/**
 * Output estructurado de Claude Vision sobre una foto corporal.
 * Guardado en `body_photos.ai_analysis`.
 *
 * Versionado para poder evolucionar el shape sin romper datos viejos.
 * Cuando cambies el prompt y el shape, sube `version` a 'v2' y mantén
 * un parser que sepa leer ambos.
 */

const BodyAnalysisV1 = z.object({
  version: z.literal("v1"),
  pose_quality: z.enum(["good", "partial", "poor"]),
  visible_areas: z.array(
    z.enum([
      "shoulders", "chest", "back", "arms", "abs", "obliques",
      "glutes", "quads", "hamstrings", "calves", "full_body",
    ]),
  ),
  observations: z.object({
    posture: z.string().max(500).optional(),
    muscle_definition: z.string().max(500).optional(),
    body_composition: z.string().max(500).optional(),
    asymmetries: z.array(z.string().max(200)).optional(),
  }),
  recommendations: z.array(
    z.object({
      focus: z.string().max(100),                   // 'core', 'glúteo', 'postura'
      suggestion: z.string().max(300),
    }),
  ).max(5),
  caveats: z.array(z.string().max(300)).optional(), // limitaciones del análisis
  generated_at: z.string().datetime(),
});

export const BodyAnalysisSchema = z.discriminatedUnion("version", [
  BodyAnalysisV1,
  // BodyAnalysisV2 cuando rompamos shape — mantén V1 acá para migrar.
]);

export type BodyAnalysis = z.infer<typeof BodyAnalysisSchema>;
