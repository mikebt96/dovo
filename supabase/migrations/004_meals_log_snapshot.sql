-- =============================================================
-- Migration 004: Snapshot del meal consumido en meals_log
--
-- Problema: meals_log.meal_id apunta al seed o al replan vigente AL MOMENTO
-- DE LEER. Si la AI rediseña la meal después de que el user la marcó, el
-- log histórico empieza a "mentir" — la fila vieja apunta a contenido nuevo.
--
-- Fix: al marcar como completada, persistimos un snapshot inmutable del
-- contenido REAL (name + ingredients + macros + flag de replanned), más
-- una referencia opcional al `meal_replans.id` que lo generó.
-- =============================================================

alter table meals_log
  add column if not exists meal_snapshot jsonb,
  add column if not exists replan_id bigint references meal_replans(id) on delete set null;

create index if not exists idx_meals_log_replan on meals_log (replan_id);
