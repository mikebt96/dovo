-- =============================================================
-- Migration 007: waitlist público para landing
--
-- Captura de los primeros 200 dúos free durante MVP (sin custodia).
-- No tiene RLS porque el server inserta con service_role; el cliente
-- nunca lee esta tabla.
--
-- - email único para evitar duplicados (el form sube uno, el otro del
--   dúo se invita después por flow interno cuando exista auth).
-- - duo_name opcional (algunos se registran solos para validar).
-- - relationship es free-text controlado por el form (parejas/amigos/
--   rivales/otros), no enum para no migrar si agregamos categoría.
-- - referrer y user_agent para entender de dónde llega tráfico sin
--   meter analytics todavía.
-- =============================================================

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  duo_name text,
  relationship text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on waitlist (created_at desc);
