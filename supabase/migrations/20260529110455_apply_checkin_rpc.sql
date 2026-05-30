-- F2 · RPC apply_checkin: inserta el check-in + sube las 6 stats + racha semanal, atómico.
-- Scoring (kcal/puntos/deltas) se calcula en TS (lib/scoring) y se pasa ya resuelto.
create or replace function core.apply_checkin(
  p_miembro_id uuid,
  p_actividad_id uuid,
  p_fecha date,
  p_metricas jsonb,
  p_kcal numeric,
  p_puntos numeric,
  p_deltas jsonb
) returns core.user_character
language plpgsql
security definer
set search_path = core
as $$
declare
  v_user_id uuid := auth.uid();
  v_week date := date_trunc('week', p_fecha)::date; -- lunes ISO de la semana del check-in
  v_char core.user_character;
  v_last date;
  v_cur int;
begin
  if not core.owns_miembro(p_miembro_id, v_user_id) then
    raise exception 'no autorizado para este miembro';
  end if;

  -- 1 · insert check-in con scoring ya calculado
  insert into core.checkins (miembro_id, actividad_id, fecha, metricas, kcal_calculadas, puntos)
  values (p_miembro_id, p_actividad_id, p_fecha, coalesce(p_metricas, '{}'::jsonb), p_kcal, p_puntos);

  -- 2 · sube las 6 stats (crea el character si no existía)
  insert into core.user_character as uc (user_id, fue, res, flex, vel, equ, vit)
  values (
    v_user_id,
    coalesce((p_deltas->>'fue')::numeric, 0),
    coalesce((p_deltas->>'res')::numeric, 0),
    coalesce((p_deltas->>'flex')::numeric, 0),
    coalesce((p_deltas->>'vel')::numeric, 0),
    coalesce((p_deltas->>'equ')::numeric, 0),
    coalesce((p_deltas->>'vit')::numeric, 0)
  )
  on conflict (user_id) do update set
    fue  = uc.fue  + coalesce((p_deltas->>'fue')::numeric, 0),
    res  = uc.res  + coalesce((p_deltas->>'res')::numeric, 0),
    flex = uc.flex + coalesce((p_deltas->>'flex')::numeric, 0),
    vel  = uc.vel  + coalesce((p_deltas->>'vel')::numeric, 0),
    equ  = uc.equ  + coalesce((p_deltas->>'equ')::numeric, 0),
    vit  = uc.vit  + coalesce((p_deltas->>'vit')::numeric, 0)
  returning * into v_char;

  -- 3 · racha semanal simple (compliance real de rutina = F3)
  select last_cumplido_week, current_streak_weeks into v_last, v_cur
  from core.user_streak where user_id = v_user_id;

  if v_last is null then
    v_cur := 1;
  elsif v_week = v_last then
    v_cur := coalesce(v_cur, 1);            -- ya contó esta semana
  elsif v_week = v_last + 7 then
    v_cur := coalesce(v_cur, 0) + 1;        -- semana consecutiva
  elsif v_week > v_last then
    v_cur := 1;                              -- hubo hueco
  else
    v_cur := coalesce(v_cur, 1);             -- check-in retroactivo viejo: no toca racha
  end if;

  insert into core.user_streak as us (user_id, current_streak_weeks, max_streak, last_cumplido_week)
  values (v_user_id, v_cur, v_cur, v_week)
  on conflict (user_id) do update set
    current_streak_weeks = v_cur,
    max_streak = greatest(us.max_streak, v_cur),
    last_cumplido_week = greatest(us.last_cumplido_week, v_week);

  return v_char;
end;
$$;

grant execute on function core.apply_checkin(uuid, uuid, date, jsonb, numeric, numeric, numeric)
  to authenticated, service_role;
