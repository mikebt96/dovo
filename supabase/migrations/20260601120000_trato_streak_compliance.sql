-- F3b · Racha del dúo por compliance + cierre semanal.
-- La racha sube una semana solo si TODOS los miembros del grupo cumplieron su
-- rutina (compliance flexible: nº de check-ins ≥ suma de frecuencias). Se evalúa
-- al cerrar la semana (pg_cron), porque "ambos cumplieron" no se sabe hasta el final.

-- ── Racha a nivel grupo ──
-- last_cumplido_week = última semana que la racha estuvo viva (para "consecutiva").
-- last_evaluated_week = última semana que el cron procesó (idempotencia + orden).
create table if not exists core.trato_streak (
  trato_id uuid primary key references core.tratos(id) on delete cascade,
  current_streak_weeks int not null default 0,
  max_streak int not null default 0,
  last_cumplido_week date,
  last_evaluated_week date,
  updated_at timestamptz not null default now()
);

alter table core.trato_streak enable row level security;
drop policy if exists trato_streak_read_member on core.trato_streak;
create policy trato_streak_read_member on core.trato_streak
  for select using (core.is_trato_member(trato_id, auth.uid()));

-- ── Compliance flexible de un miembro en una semana ISO (lunes p_week) ──
-- cumple = (# check-ins de la semana) ≥ (Σ frecuencia_semanal de su rutina default),
-- y solo si tiene rutina con target > 0 (sin rutina configurada ⇒ no cumple).
create or replace function core.compliance_miembro(p_miembro_id uuid, p_week date)
returns boolean
language sql
security definer
set search_path = core
as $$
  with target as (
    select coalesce(sum((a->>'frecuencia_semanal')::int), 0) as freq
    from core.user_rutinas r,
         lateral jsonb_array_elements(r.actividades) a
    where r.miembro_id = p_miembro_id and r.is_default
  ),
  hechos as (
    select count(*) as n
    from core.checkins
    where miembro_id = p_miembro_id
      and fecha >= p_week and fecha < p_week + 7
  )
  select t.freq > 0 and h.n >= t.freq
  from target t, hechos h;
$$;

-- ── Cierre semanal: evalúa todos los grupos activos para la semana p_week ──
-- Devuelve cuántos grupos procesó. Idempotente: no reprocesa una semana ya evaluada.
create or replace function core.cerrar_semana_rachas(p_week date)
returns int
language plpgsql
security definer
set search_path = core
as $$
declare
  r record;
  v_all boolean;
  v_last date;
  v_cur int;
  v_eval date;
  n int := 0;
begin
  for r in select id from core.tratos where estado = 'activo' loop
    -- ¿todos los miembros cumplieron? bool_and sobre 0 miembros → null ⇒ skip
    select bool_and(core.compliance_miembro(m.id, p_week)) into v_all
    from core.trato_miembros m
    where m.trato_id = r.id;
    if v_all is null then
      continue;
    end if;

    select last_cumplido_week, current_streak_weeks, last_evaluated_week
      into v_last, v_cur, v_eval
    from core.trato_streak where trato_id = r.id;

    -- no reprocesar una semana ya evaluada (idempotencia y orden hacia adelante)
    if v_eval is not null and p_week <= v_eval then
      continue;
    end if;

    if v_all then
      if v_last is not null and p_week = v_last + 7 then
        v_cur := coalesce(v_cur, 0) + 1;     -- semana consecutiva
      else
        v_cur := 1;                           -- primera, o tras hueco/ruptura
      end if;
      insert into core.trato_streak as ts (trato_id, current_streak_weeks, max_streak, last_cumplido_week, last_evaluated_week)
      values (r.id, v_cur, v_cur, p_week, p_week)
      on conflict (trato_id) do update set
        current_streak_weeks = v_cur,
        max_streak = greatest(ts.max_streak, v_cur),
        last_cumplido_week = p_week,
        last_evaluated_week = p_week,
        updated_at = now();
    else
      -- no todos cumplieron → la racha se rompe (last_cumplido_week no avanza)
      insert into core.trato_streak as ts (trato_id, current_streak_weeks, max_streak, last_cumplido_week, last_evaluated_week)
      values (r.id, 0, 0, null, p_week)
      on conflict (trato_id) do update set
        current_streak_weeks = 0,
        last_evaluated_week = p_week,
        updated_at = now();
    end if;

    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke execute on function core.compliance_miembro(uuid, date) from public;
revoke execute on function core.cerrar_semana_rachas(date) from public;
grant execute on function core.cerrar_semana_rachas(date) to service_role;
