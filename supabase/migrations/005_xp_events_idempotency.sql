-- =============================================================
-- Migration 005: idempotencia en xp_events
--
-- Problema: si el cliente reintenta un award (red flaky, retry de
-- Server Action, doble-click) se duplica el XP otorgado.
--
-- Fix: UNIQUE INDEX sobre (profile_id, source, source_ref) cuando
-- source_ref no es NULL. Cada award define un source_ref estable:
--   - 'meal:{meal_id}:{date}'        → 1 por meal × día × profile
--   - 'day_complete:{date}'          → 1 por día × profile
--   - 'pair_bonus:{date}'            → 1 por día × profile
--   - 'penalty:{pair_debt_id}'       → 1 por deuda × profile
--
-- Si insertas un duplicado, Postgres devuelve error 23505 que tratamos
-- como "ya ganado, no-op".
-- =============================================================

create unique index if not exists uniq_xp_events_dedup
  on xp_events (profile_id, source, source_ref)
  where source_ref is not null;
