-- ════════════════════════════════════════════════════════════════════
-- Pre-entreno (spec del founder): "¿alguna molestia hoy?" antes de entrenar.
-- El jugador reporta zona(s) con molestia; el plan del día marca "cuídate hoy"
-- los ejercicios que cargan esa zona (el catálogo F9 sabe el grupo muscular).
-- Historial honesto: queda registrado por fecha (el coach IA lo usará con key).
-- ════════════════════════════════════════════════════════════════════

create table if not exists core.molestias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  fecha date not null,
  zona text not null check (zona in ('rodilla','hombro','espalda_baja','muneca','tobillo','cadera','cuello')),
  created_at timestamptz not null default now(),
  unique (user_id, fecha, zona)
);

create index if not exists molestias_user_fecha_idx on core.molestias(user_id, fecha);

alter table core.molestias enable row level security;
drop policy if exists molestias_owner_all on core.molestias;
create policy molestias_owner_all on core.molestias
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- default privileges dan de más (gotcha F10): dejar solo lo que el flujo usa
revoke all on core.molestias from authenticated;
grant select, insert, delete on core.molestias to authenticated;
grant all on core.molestias to service_role;
