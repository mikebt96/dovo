-- ════════════════════════════════════════════════════════════════════
-- TratoHUD + Veredicto del Domingo (directiva del consejo 2026-06-10, P1).
--
-- 1 · core.estado_trato(p_trato_id): el "party status" del juego cooperativo.
--     La rutina del compañero es owner-only por RLS (rutinas_owner_all), así
--     que su frecuencia objetivo NO es legible desde el cliente — esta RPC
--     SECURITY DEFINER, gated por is_trato_member, expone por miembro lo
--     mínimo que el lobby necesita: objetivo semanal, check-ins de la semana
--     CDMX y si ya entrenó HOY. Reusa la fórmula de compliance_miembro.
--
-- 2 · core.veredictos_vistos: el Veredicto se ceremonia UNA sola vez por
--     usuario y semana (persistido en DB — localStorage muere entre devices).
-- ════════════════════════════════════════════════════════════════════

create or replace function core.estado_trato(p_trato_id uuid)
returns table (
  user_id uuid,
  nombre text,
  freq_objetivo int,
  checkins_semana int,
  checkin_hoy boolean
)
language sql
security definer
set search_path = core
as $$
  with semana as (
    select date_trunc('week', (now() at time zone 'America/Mexico_City'))::date as lunes,
           ((now() at time zone 'America/Mexico_City'))::date as hoy
  )
  select
    m.user_id,
    u.nombre,
    coalesce((
      select sum((a->>'frecuencia_semanal')::int)
      from core.user_rutinas r,
           lateral jsonb_array_elements(r.actividades) a
      where r.miembro_id = m.id and r.is_default
    ), 0)::int as freq_objetivo,
    (
      select count(*)::int
      from core.checkins c, semana s
      where c.miembro_id = m.id and c.fecha >= s.lunes and c.fecha < s.lunes + 7
    ) as checkins_semana,
    exists(
      select 1 from core.checkins c, semana s
      where c.miembro_id = m.id and c.fecha = s.hoy
    ) as checkin_hoy
  from core.trato_miembros m
  join core.users u on u.id = m.user_id
  -- gate: no-miembros reciben 0 filas (sin filtración, sin excepción)
  where m.trato_id = p_trato_id
    and core.is_trato_member(p_trato_id, auth.uid());
$$;

revoke execute on function core.estado_trato(uuid) from public;
grant execute on function core.estado_trato(uuid) to authenticated, service_role;

-- ── Veredictos vistos (una ceremonia por usuario · trato · semana) ──
create table if not exists core.veredictos_vistos (
  user_id uuid not null references core.users(id) on delete cascade,
  trato_id uuid not null references core.tratos(id) on delete cascade,
  week date not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, trato_id, week)
);

alter table core.veredictos_vistos enable row level security;

drop policy if exists veredictos_vistos_owner on core.veredictos_vistos;
create policy veredictos_vistos_owner on core.veredictos_vistos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ALTER DEFAULT PRIVILEGES (20260519) da permisos implícitos a authenticated en
-- tablas nuevas de core — dejar SOLO lo que el flujo usa (gotcha F10).
revoke all on core.veredictos_vistos from authenticated;
grant select, insert on core.veredictos_vistos to authenticated;
grant all on core.veredictos_vistos to service_role;
