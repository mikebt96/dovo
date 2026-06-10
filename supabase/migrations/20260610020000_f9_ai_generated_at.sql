-- F9 fix (review adversarial): el rate-limit semanal de IA no puede depender de
-- source/generated_at porque regenerarPlanSample los pisa al guardar la rutina
-- (loop save→regenerate = Opus ilimitado). Timestamp DEDICADO que el sample jamás toca.
alter table core.workout_plans add column if not exists ai_generated_at timestamptz;
comment on column core.workout_plans.ai_generated_at is
  'Última generación IA exitosa. SOLO la escribe regenerateWorkoutAi; el rate-limit (1/semana) se gatea contra esta columna, no contra source/generated_at.';
