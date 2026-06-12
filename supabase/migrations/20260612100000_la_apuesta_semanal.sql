-- ════════════════════════════════════════════════════════════════════
-- LA APUESTA SEMANAL — el trasfondo de la app (mandato del founder 2026-06-12):
-- "el compromiso entre ambos para ser mejores y en conjunto ir ganando cosas".
--
-- Mecánica: el dúo sella qué se juega esta semana — un PREMIO conjunto ("ir al
-- cine") y una APUESTA interna ("las palomitas"). Al Veredicto del Domingo:
--   · AMBOS cumplieron → premio GANADO juntos + el que le echó menos ganas
--     (menos puntos_base de la semana — ya normalizados por BMR: justo entre
--     cuerpos distintos) paga la apuesta. Empate → nadie paga.
--   · alguien falló → sin premio (la deuda mayor es mecánica aparte, P2).
-- La app PROPONE premios según la racha (catálogo escalonado en TS — a más
-- constancia, premios más grandes porque ya se los ganaron) pero JAMÁS los
-- impone: el texto final es del dúo.
-- ════════════════════════════════════════════════════════════════════

create table if not exists core.apuestas (
  id uuid primary key default gen_random_uuid(),
  trato_id uuid not null references core.tratos(id) on delete cascade,
  week_start date not null, -- lunes ISO de la semana que se juega
  premio_text text not null check (length(premio_text) between 1 and 140),
  apuesta_text text not null check (length(apuesta_text) between 1 and 140),
  estado text not null default 'viva' check (estado in ('viva','ganada','perdida')),
  perdedor_interno uuid references core.users(id) on delete set null,
  saldada boolean not null default false,
  created_by uuid not null references core.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trato_id, week_start)
);

drop trigger if exists apuestas_updated_at on core.apuestas;
create trigger apuestas_updated_at
  before update on core.apuestas
  for each row execute function core.set_updated_at();

alter table core.apuestas enable row level security;
drop policy if exists apuestas_member_select on core.apuestas;
create policy apuestas_member_select on core.apuestas
  for select using (core.is_trato_member(trato_id, auth.uid()));
drop policy if exists apuestas_member_insert on core.apuestas;
create policy apuestas_member_insert on core.apuestas
  for insert with check (core.is_trato_member(trato_id, auth.uid()) and created_by = auth.uid());
drop policy if exists apuestas_member_update on core.apuestas;
create policy apuestas_member_update on core.apuestas
  for update using (core.is_trato_member(trato_id, auth.uid()));

revoke all on core.apuestas from authenticated;
grant select, insert, update on core.apuestas to authenticated;
grant all on core.apuestas to service_role;

-- ── Cierre de apuestas: corre DESPUÉS del Veredicto (cerrar_semana_rachas).
-- Separada a propósito: no tocamos la función del Veredicto antes de su
-- primera corrida real. Idempotente (solo estado='viva'). ──
create or replace function core.cerrar_apuestas(p_week date)
returns int
language plpgsql
security definer
set search_path = core
as $$
declare
  a record;
  v_cumplio boolean;
  v_perdedor uuid;
  n int := 0;
begin
  for a in select * from core.apuestas where week_start = p_week and estado = 'viva' loop
    -- el Veredicto ya juzgó: cumplieron ⇔ la racha selló esta semana
    select (ts.last_cumplido_week = p_week) into v_cumplio
    from core.trato_streak ts where ts.trato_id = a.trato_id;

    if v_cumplio is null then
      continue; -- el Veredicto aún no procesa este trato: la apuesta espera
    end if;

    if v_cumplio then
      -- el que le echó menos ganas: menos puntos_base (normalizados) en la
      -- semana. Empate digno en el fondo ⇒ null (nadie paga).
      with pts as (
        select m.user_id, coalesce(sum(c.puntos_base), 0) as p
        from core.trato_miembros m
        left join core.checkins c on c.miembro_id = m.id
          and c.fecha >= p_week and c.fecha < p_week + 7
        where m.trato_id = a.trato_id
        group by m.user_id
      )
      select case
        when (select count(*) from pts where p = (select min(p) from pts)) > 1 then null
        else (select user_id from pts order by p asc limit 1)
      end into v_perdedor;

      update core.apuestas
         set estado = 'ganada', perdedor_interno = v_perdedor
       where id = a.id;
    else
      update core.apuestas set estado = 'perdida' where id = a.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke execute on function core.cerrar_apuestas(date) from public, anon, authenticated;
grant execute on function core.cerrar_apuestas(date) to service_role;

-- agenda: 06:10 UTC lunes = 00:10 CDMX, 11 min después del Veredicto (05:59)
do $do$
begin
  if exists (select 1 from cron.job where jobname = 'cerrar-apuestas') then
    perform cron.unschedule('cerrar-apuestas');
  end if;
end
$do$;

select cron.schedule(
  'cerrar-apuestas',
  '10 6 * * 1',
  $job$select core.cerrar_apuestas((date_trunc('week', (now() at time zone 'America/Mexico_City') - interval '1 hour'))::date)$job$
);
