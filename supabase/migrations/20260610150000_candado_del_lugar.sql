-- ════════════════════════════════════════════════════════════════════
-- El candado del lugar (mandato de Miguel 2026-06-10): validación automática
-- de que la actividad SÍ ocurrió, sin trampas y sin vigilancia.
--
-- Mecánica: el jugador ANCLA su lugar una vez (su gym, su estudio). Cada
-- check-in manda UNA muestra de ubicación tomada en el momento del tap; si cae
-- dentro del radio del ancla, el check-in gana el SELLO DEL LUGAR — visible
-- para el compa (la confianza es entre los dos). Sin sello NO se castiga: GPS
-- negado/fallido o actividad sin lugar fijo simplemente no sella (regla del
-- consejo: jamás castigar al honesto; el sello es prueba positiva, no gate).
--
-- Privacidad por diseño: se guarda el ANCLA (elegida explícitamente) + un
-- booleano + la distancia. Las coordenadas de cada check-in NO se persisten.
-- ════════════════════════════════════════════════════════════════════

create table if not exists core.lugares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  actividad_id uuid not null references core.actividades(id) on delete cascade,
  nombre text not null default 'mi lugar',
  lat double precision not null,
  lng double precision not null,
  radio_m int not null default 150 check (radio_m between 30 and 1000),
  created_at timestamptz not null default now(),
  unique (user_id, actividad_id)
);

alter table core.lugares enable row level security;
drop policy if exists lugares_owner_all on core.lugares;
create policy lugares_owner_all on core.lugares
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- default privileges dan de más — dejar solo lo que el flujo usa (gotcha F10)
revoke all on core.lugares from authenticated;
grant select, insert, update, delete on core.lugares to authenticated;
grant all on core.lugares to service_role;

-- ── checkins: el sello ──
alter table core.checkins add column if not exists verificado boolean not null default false;
alter table core.checkins add column if not exists verif_dist_m int;

-- ── apply_checkin v2: mismas reglas + el sello viaja con el insert ──
-- La firma CAMBIA (2 params nuevos con default) → drop explícito del overload
-- viejo: dos overloads romperían PostgREST por ambigüedad. El código viejo en
-- vuelo (deploy window) llama con 7 args y los defaults lo cubren.
drop function if exists core.apply_checkin(uuid, uuid, date, jsonb, numeric, numeric, jsonb);

create or replace function core.apply_checkin(
  p_miembro_id uuid, p_actividad_id uuid, p_fecha date,
  p_metricas jsonb, p_kcal numeric, p_puntos numeric, p_deltas jsonb,
  p_verificado boolean default false, p_verif_dist_m int default null
) returns core.user_character
language plpgsql security definer set search_path = core
as $$
declare
  v_user_id uuid := auth.uid();
  v_week date := date_trunc('week', p_fecha)::date;
  v_char core.user_character;
  v_last date; v_cur int;
  v_boost_id uuid; v_mult numeric := 1;
  v_base numeric; v_puntos numeric;
  v_deltas jsonb := coalesce(p_deltas, '{}'::jsonb);
  v_count_act int;
begin
  if not core.owns_miembro(p_miembro_id, v_user_id) then
    raise exception 'no autorizado para este miembro';
  end if;

  -- CAPS: tope por sesión + máximo de check-ins por actividad/día (última defensa).
  v_base := least(p_puntos, 1000);                              -- CAP_PUNTOS_SESION
  select count(*) into v_count_act from core.checkins
   where miembro_id = p_miembro_id and actividad_id = p_actividad_id and fecha = p_fecha;
  if v_count_act >= 3 then                                      -- CAP_CHECKINS_ACTIVIDAD_DIA
    raise exception 'límite de check-ins para esta actividad hoy';
  end if;

  -- BOOST energía activo no consumido (consume el más viejo). +50% a personaje, NO a leaderboard.
  select id into v_boost_id from core.boosts
   where para_user = v_user_id and tipo = 'energia' and not aplicado and now() < fecha_expira
   order by fecha_otorgado asc limit 1 for update skip locked;
  if v_boost_id is not null then
    v_mult := 1.5;                                              -- BOOST_FACTOR
    v_deltas := coalesce((
      select jsonb_object_agg(k, (coalesce(val,'0')::numeric * v_mult))
      from jsonb_each_text(v_deltas) as e(k, val)
    ), '{}'::jsonb);
    update core.boosts set aplicado = true where id = v_boost_id;
  end if;
  v_puntos := round(v_base * v_mult);

  -- 1 · check-in: puntos_base (crudo → leaderboard/retos) + puntos (boosteado → personaje)
  --     + el sello del lugar (calculado por el server action contra core.lugares)
  insert into core.checkins (miembro_id, actividad_id, fecha, metricas, kcal_calculadas, puntos, puntos_base, verificado, verif_dist_m)
  values (p_miembro_id, p_actividad_id, p_fecha, coalesce(p_metricas,'{}'::jsonb), p_kcal, v_puntos, v_base,
          coalesce(p_verificado, false), p_verif_dist_m);

  -- 2 · sube las 6 stats (deltas boosteados)
  insert into core.user_character as uc (user_id, fue, res, flex, vel, equ, vit) values (
    v_user_id,
    coalesce((v_deltas->>'fue')::numeric,0),  coalesce((v_deltas->>'res')::numeric,0),
    coalesce((v_deltas->>'flex')::numeric,0), coalesce((v_deltas->>'vel')::numeric,0),
    coalesce((v_deltas->>'equ')::numeric,0),  coalesce((v_deltas->>'vit')::numeric,0))
  on conflict (user_id) do update set
    fue=uc.fue+coalesce((v_deltas->>'fue')::numeric,0),   res=uc.res+coalesce((v_deltas->>'res')::numeric,0),
    flex=uc.flex+coalesce((v_deltas->>'flex')::numeric,0),vel=uc.vel+coalesce((v_deltas->>'vel')::numeric,0),
    equ=uc.equ+coalesce((v_deltas->>'equ')::numeric,0),   vit=uc.vit+coalesce((v_deltas->>'vit')::numeric,0)
  returning * into v_char;

  -- 3 · racha semanal del usuario (idéntico al original)
  select last_cumplido_week, current_streak_weeks into v_last, v_cur from core.user_streak where user_id=v_user_id;
  if v_last is null then v_cur:=1;
  elsif v_week=v_last then v_cur:=coalesce(v_cur,1);
  elsif v_week=v_last+7 then v_cur:=coalesce(v_cur,0)+1;
  elsif v_week>v_last then v_cur:=1; else v_cur:=coalesce(v_cur,1); end if;
  insert into core.user_streak as us (user_id,current_streak_weeks,max_streak,last_cumplido_week)
  values (v_user_id, v_cur, v_cur, v_week)
  on conflict (user_id) do update set
    current_streak_weeks=v_cur, max_streak=greatest(us.max_streak,v_cur),
    last_cumplido_week=greatest(us.last_cumplido_week, v_week);

  return v_char;
end; $$;

revoke execute on function core.apply_checkin(uuid,uuid,date,jsonb,numeric,numeric,jsonb,boolean,int) from public;
grant  execute on function core.apply_checkin(uuid,uuid,date,jsonb,numeric,numeric,jsonb,boolean,int) to authenticated, service_role;

-- ── estado_trato v2: el compa VE el sello de hoy ──
-- (cambia el return type → drop + create)
drop function if exists core.estado_trato(uuid);

create function core.estado_trato(p_trato_id uuid)
returns table (
  user_id uuid,
  nombre text,
  freq_objetivo int,
  checkins_semana int,
  checkin_hoy boolean,
  checkin_hoy_sellado boolean
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
    ) as checkin_hoy,
    exists(
      select 1 from core.checkins c, semana s
      where c.miembro_id = m.id and c.fecha = s.hoy and c.verificado
    ) as checkin_hoy_sellado
  from core.trato_miembros m
  join core.users u on u.id = m.user_id
  where m.trato_id = p_trato_id
    and core.is_trato_member(p_trato_id, auth.uid());
$$;

revoke execute on function core.estado_trato(uuid) from public;
grant execute on function core.estado_trato(uuid) to authenticated, service_role;
