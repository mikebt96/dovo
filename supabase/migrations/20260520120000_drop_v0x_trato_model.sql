-- F1 · Drop del modelo v0.x de tratos (dovo commitment device).
-- BD limpia (0 tratos, 0 checkins en producción), drop seguro.
-- Mantiene: core.users, sponsored_tratos, brand_partners, reward_codes, pulse.*

-- Trigger + función de scoring viejo
drop trigger if exists trato_cerrado_bumps_score on core.tratos;
drop function if exists core.bump_user_score();

-- Tablas del modelo viejo (cascade limpia FKs)
drop table if exists core.checkins cascade;
drop table if exists core.user_scores cascade;
drop table if exists core.tratos cascade;

-- Types del modelo viejo
drop type if exists core.trato_estado cascade;
drop type if exists core.trato_resultado cascade;
drop type if exists core.score_visibility cascade;
