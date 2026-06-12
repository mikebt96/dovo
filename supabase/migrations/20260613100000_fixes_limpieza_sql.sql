-- ════════════════════════════════════════════════════════════════════
-- F23·G19 · Fixes SQL de la limpieza (hallazgos alta del consejo auditor).
--
-- 1 · cerrar_apuestas: con racha ROTA la fila de trato_streak queda con
--     last_cumplido_week NULL ⇒ (null = p_week) es NULL ⇒ el loop hacía
--     `continue` y la apuesta quedaba 'viva' PARA SIEMPRE aunque el Veredicto
--     ya había juzgado. Ahora: procesado = last_evaluated_week >= p_week;
--     cumplido = coalesce(=, false) ⇒ rota ⇒ apuesta 'perdida'. ✔
-- 2 · food_logs: default de fecha en UTC ⇒ cinturón CDMX (el código ya manda
--     fecha explícita desde G17.6).
-- 3 · cerrar_reto: guard de periodo — nadie cierra un duelo ANTES de que
--     termine (defensa en profundidad del countdown del scoreboard).
-- ════════════════════════════════════════════════════════════════════

-- ── 1 · cerrar_apuestas v2 (misma firma — el cron no se toca) ──
create or replace function core.cerrar_apuestas(p_week date)
returns int
language plpgsql
security definer
set search_path = core
as $$
declare
  a record;
  v_procesado boolean;
  v_cumplio boolean;
  v_perdedor uuid;
  n int := 0;
begin
  for a in select * from core.apuestas where week_start = p_week and estado = 'viva' loop
    select (ts.last_evaluated_week >= p_week),
           coalesce(ts.last_cumplido_week = p_week, false)
      into v_procesado, v_cumplio
    from core.trato_streak ts where ts.trato_id = a.trato_id;

    -- el Veredicto aún no procesa este trato (o no hay fila): la apuesta espera
    if v_procesado is distinct from true then
      continue;
    end if;

    if v_cumplio then
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

-- ── 2 · food_logs: default CDMX ──
alter table core.food_logs
  alter column fecha set default ((now() at time zone 'America/Mexico_City')::date);

-- ── 3 · cerrar_reto v3 = v2 + guard de periodo ──
create or replace function core.cerrar_reto(p_reto_id uuid)
returns core.retos
language plpgsql security definer set search_path = core, pg_temp as $$
declare
  v_reto core.retos;
  v_a numeric; v_b numeric; v_ganador uuid;
begin
  select * into v_reto from core.retos where id = p_reto_id for update;
  if v_reto.id is null then raise exception 'reto no existe'; end if;
  if not (core.is_reto_party(v_reto.trato_a, v_reto.trato_b, auth.uid()) or auth.role() = 'service_role') then
    raise exception 'no autorizado';
  end if;
  if v_reto.estado = 'cerrado' then
    return v_reto;                                              -- idempotente
  end if;

  -- guard F23·G19: el duelo no se cierra antes de tiempo desde el cliente
  -- (el cron service_role sí puede — limpia duelos en estados raros)
  if v_reto.estado in ('aceptado','activo')
     and ((now() at time zone 'America/Mexico_City'))::date < v_reto.periodo_fin
     and auth.role() <> 'service_role' then
    raise exception 'el duelo aún no termina';
  end if;

  v_a := core.puntos_reto(p_reto_id, v_reto.trato_a);
  v_b := core.puntos_reto(p_reto_id, v_reto.trato_b);

  v_ganador := case when v_a > v_b then v_reto.trato_a when v_b > v_a then v_reto.trato_b else null end;
  update core.retos set estado='cerrado', ganador_trato_id = v_ganador, updated_at = now()
    where id = p_reto_id returning * into v_reto;
  return v_reto;
end; $$;
revoke execute on function core.cerrar_reto(uuid) from public;
revoke execute on function core.cerrar_reto(uuid) from anon;
grant execute on function core.cerrar_reto(uuid) to authenticated, service_role;
