-- F3c · Resumen mensual: por cada miembro de cada dúo activo, los números del mes.
-- La consume la edge function `monthly-summary` (invocada por pg_cron el día 1) que
-- arma y manda el email. p_mes_inicio = primer día del mes a resumir (ej. 2026-05-01).
create or replace function core.resumen_mensual(p_mes_inicio date)
returns table (
  user_id uuid,
  email text,
  nombre text,
  trato_id uuid,
  nombre_grupo text,
  checkins_mes bigint,
  puntos_mes numeric,
  racha_duo integer,
  fue numeric, res numeric, flex numeric, vel numeric, equ numeric, vit numeric
)
language sql
security definer
set search_path = core
as $$
  select
    u.id, u.email, u.nombre,
    t.id, t.nombre_grupo,
    coalesce(c.n, 0)   as checkins_mes,
    coalesce(c.pts, 0) as puntos_mes,
    coalesce(ts.current_streak_weeks, 0) as racha_duo,
    coalesce(ch.fue, 0), coalesce(ch.res, 0), coalesce(ch.flex, 0),
    coalesce(ch.vel, 0), coalesce(ch.equ, 0), coalesce(ch.vit, 0)
  from core.tratos t
  join core.trato_miembros m on m.trato_id = t.id
  join core.users u on u.id = m.user_id
  left join core.trato_streak ts on ts.trato_id = t.id
  left join core.user_character ch on ch.user_id = u.id
  left join lateral (
    select count(*) as n, coalesce(sum(ck.puntos), 0) as pts
    from core.checkins ck
    where ck.miembro_id = m.id
      and ck.fecha >= p_mes_inicio
      and ck.fecha < (p_mes_inicio + interval '1 month')::date
  ) c on true
  where t.estado = 'activo';
$$;

revoke execute on function core.resumen_mensual(date) from public;
grant execute on function core.resumen_mensual(date) to service_role;
