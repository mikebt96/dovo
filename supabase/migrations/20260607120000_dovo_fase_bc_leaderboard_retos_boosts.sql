-- Fase B (leaderboard de dúos) + Fase C (retos dúo-vs-dúo) + boosts intra-dúo + showcase anon.
-- Reusa is_trato_member / owns_miembro / set_updated_at (20260520120001_dovofit_core_model).
-- Regla de oro: punitivo SOLO entre dúos rivales (retos); intra-dúo SOLO positivo (boosts).
-- Aditiva e idempotente. CERO drop de columnas vivas.

-- ════════════════════════════════════════════════════════════════════
-- 0 · ENUMS + columnas nuevas
-- ════════════════════════════════════════════════════════════════════
do $$ begin
  create type core.reto_estado as enum ('propuesto','aceptado','activo','cerrado','rechazado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type core.boost_tipo as enum ('energia','escudo');
exception when duplicate_object then null; end $$;

-- showcase: marca dúos demo seguros de exponer a anon. SOLO service_role lo escribe (trigger §2).
alter table core.tratos add column if not exists is_demo boolean not null default false;

-- separa puntaje crudo (leaderboard/retos) del boosteado (personaje). Brief C5.
alter table core.checkins add column if not exists puntos_base numeric;
update core.checkins set puntos_base = coalesce(puntos, 0) where puntos_base is null;
alter table core.checkins alter column puntos_base set not null;

-- ════════════════════════════════════════════════════════════════════
-- 1 · Helpers
-- ════════════════════════════════════════════════════════════════════
create or replace function core.is_reto_party(p_a uuid, p_b uuid, p_user uuid)
returns boolean language sql security definer stable set search_path = core as $$
  select core.is_trato_member(p_a, p_user) or core.is_trato_member(p_b, p_user);
$$;
revoke execute on function core.is_reto_party(uuid,uuid,uuid) from public;

-- ════════════════════════════════════════════════════════════════════
-- 2 · Trigger: is_demo solo service_role (cierra fuga PII del showcase). Brief C7.
-- ════════════════════════════════════════════════════════════════════
create or replace function core.guard_is_demo() returns trigger
language plpgsql security definer set search_path = core as $$
begin
  if new.is_demo is distinct from old.is_demo and auth.role() <> 'service_role' then
    raise exception 'is_demo solo lo modifica service_role';
  end if;
  return new;
end; $$;

drop trigger if exists tratos_guard_is_demo on core.tratos;
create trigger tratos_guard_is_demo before update on core.tratos
  for each row execute function core.guard_is_demo();

-- ════════════════════════════════════════════════════════════════════
-- 3 · Tabla retos (duelo dúo-vs-dúo)
-- ════════════════════════════════════════════════════════════════════
create table if not exists core.retos (
  id uuid primary key default gen_random_uuid(),
  trato_a uuid not null references core.tratos(id) on delete cascade,
  trato_b uuid not null references core.tratos(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fin date not null,                                   -- exclusivo (half-open)
  estado core.reto_estado not null default 'propuesto',
  creado_por uuid not null references core.users(id) on delete restrict,
  ganador_trato_id uuid references core.tratos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retos_distintos check (trato_a <> trato_b),
  constraint retos_periodo_valido check (periodo_fin > periodo_inicio),
  constraint retos_ganador_valido check (ganador_trato_id is null or ganador_trato_id in (trato_a, trato_b)),
  constraint retos_ganador_solo_cerrado check (ganador_trato_id is null or estado = 'cerrado')
);
create index if not exists retos_trato_a_idx on core.retos(trato_a);
create index if not exists retos_trato_b_idx on core.retos(trato_b);
create index if not exists retos_estado_idx on core.retos(estado);
-- 1 reto vivo por par de dúos (par normalizado).
create unique index if not exists retos_par_vivo_idx
  on core.retos (least(trato_a, trato_b), greatest(trato_a, trato_b))
  where estado in ('propuesto','aceptado','activo');
drop trigger if exists retos_updated_at on core.retos;
create trigger retos_updated_at before update on core.retos
  for each row execute function core.set_updated_at();

alter table core.retos enable row level security;
drop policy if exists retos_read_party on core.retos;
create policy retos_read_party on core.retos for select
  using (core.is_reto_party(trato_a, trato_b, auth.uid()));
drop policy if exists retos_insert_challenger on core.retos;
create policy retos_insert_challenger on core.retos for insert with check (
  auth.uid() = creado_por and core.is_trato_member(trato_a, auth.uid()) and trato_a <> trato_b);
drop policy if exists retos_update_party on core.retos;
create policy retos_update_party on core.retos for update
  using (core.is_reto_party(trato_a, trato_b, auth.uid()))
  with check (core.is_reto_party(trato_a, trato_b, auth.uid()));
-- sin DELETE: los retos quedan como historial.

-- ════════════════════════════════════════════════════════════════════
-- 4 · Tabla boosts (regalo intra-dúo, solo positivo)
-- ════════════════════════════════════════════════════════════════════
create table if not exists core.boosts (
  id uuid primary key default gen_random_uuid(),
  de_user uuid not null references core.users(id) on delete cascade,
  para_user uuid not null references core.users(id) on delete cascade,
  trato_id uuid not null references core.tratos(id) on delete cascade,
  tipo core.boost_tipo not null,
  fecha_otorgado timestamptz not null default now(),
  fecha_expira timestamptz not null,
  aplicado boolean not null default false,
  created_at timestamptz not null default now(),
  constraint boosts_no_self check (de_user <> para_user),
  constraint boosts_vigencia check (fecha_expira > fecha_otorgado)
);
create index if not exists boosts_para_user_idx on core.boosts(para_user);
create index if not exists boosts_trato_idx on core.boosts(trato_id);
create index if not exists boosts_activo_idx on core.boosts (para_user, aplicado, fecha_expira) where not aplicado;

alter table core.boosts enable row level security;
drop policy if exists boosts_read_member on core.boosts;
create policy boosts_read_member on core.boosts for select
  using (core.is_trato_member(trato_id, auth.uid()));
drop policy if exists boosts_insert_giver on core.boosts;
create policy boosts_insert_giver on core.boosts for insert with check (
  auth.uid() = de_user and de_user <> para_user
  and core.is_trato_member(trato_id, de_user)
  and core.is_trato_member(trato_id, para_user));
-- sin UPDATE/DELETE para clientes: 'aplicado' lo mueve apply_checkin (definer).

-- ════════════════════════════════════════════════════════════════════
-- 5 · apply_checkin (recrear, MISMA firma): + caps anti-trampa + boost energía
-- ════════════════════════════════════════════════════════════════════
create or replace function core.apply_checkin(
  p_miembro_id uuid, p_actividad_id uuid, p_fecha date,
  p_metricas jsonb, p_kcal numeric, p_puntos numeric, p_deltas jsonb
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
  insert into core.checkins (miembro_id, actividad_id, fecha, metricas, kcal_calculadas, puntos, puntos_base)
  values (p_miembro_id, p_actividad_id, p_fecha, coalesce(p_metricas,'{}'::jsonb), p_kcal, v_puntos, v_base);

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

revoke execute on function core.apply_checkin(uuid,uuid,date,jsonb,numeric,numeric,jsonb) from public;
grant  execute on function core.apply_checkin(uuid,uuid,date,jsonb,numeric,numeric,jsonb) to authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- 6 · RPC leaderboard_duos (autenticada) — promedio por miembro, usa puntos_base
-- ════════════════════════════════════════════════════════════════════
create or replace function core.leaderboard_duos(
  p_period_start date, p_period_end date, p_limit int default 50, p_solo_parejas boolean default true
)
returns table (posicion bigint, trato_id uuid, nombre_grupo text, n_miembros int,
               total_puntos numeric, puntos_por_miembro numeric, racha_duo int, top_clase text, top_stat text)
language sql security definer set search_path = core as $$
  with miembros as (
    select tm.trato_id, tm.id as miembro_id, tm.user_id
    from core.trato_miembros tm join core.tratos t on t.id = tm.trato_id
    where t.estado='activo' and (not p_solo_parejas or t.tipo_grupo='pareja')),
  pts as (
    select m.trato_id, coalesce(sum(c.puntos_base),0) as total
    from miembros m left join core.checkins c
      on c.miembro_id=m.miembro_id and c.fecha>=p_period_start and c.fecha<p_period_end
    group by m.trato_id),
  chars as (
    select m.trato_id, count(distinct m.user_id) as n,
      sum(coalesce(ch.fue,0)) fue, sum(coalesce(ch.res,0)) res, sum(coalesce(ch.flex,0)) flex,
      sum(coalesce(ch.vel,0)) vel, sum(coalesce(ch.equ,0)) equ, sum(coalesce(ch.vit,0)) vit
    from miembros m left join core.user_character ch on ch.user_id=m.user_id group by m.trato_id),
  tclase as (
    select distinct on (m.trato_id) m.trato_id, ch.class_name
    from miembros m join core.user_character ch on ch.user_id=m.user_id
    order by m.trato_id, ch.xp desc nulls last),
  ranked as (
    select t.id trato_id, t.nombre_grupo, cz.n n_miembros, p.total total_puntos,
      round(p.total/nullif(cz.n,0),2) ppm, coalesce(ts.current_streak_weeks,0) racha,
      tc.class_name top_clase,
      (array['FUE','RES','FLEX','VEL','EQU','VIT'])[
        (select i from (select i,v from unnest(array[cz.fue,cz.res,cz.flex,cz.vel,cz.equ,cz.vit])
          with ordinality as u(v,i) order by v desc, i asc limit 1) z)] top_stat
    from core.tratos t
    join chars cz on cz.trato_id=t.id join pts p on p.trato_id=t.id
    left join core.trato_streak ts on ts.trato_id=t.id left join tclase tc on tc.trato_id=t.id
    where t.estado='activo')
  select rank() over (order by ppm desc nulls last, total_puntos desc), trato_id, nombre_grupo,
         n_miembros, total_puntos, ppm, racha, top_clase, top_stat
  from ranked order by 1 limit greatest(p_limit,1);
$$;
revoke execute on function core.leaderboard_duos(date,date,int,boolean) from public;
grant  execute on function core.leaderboard_duos(date,date,int,boolean) to authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- 7 · RPC leaderboard_demo (anon) — solo is_demo, CERO PII, allowlist de columnas
-- ════════════════════════════════════════════════════════════════════
create or replace function core.leaderboard_demo(p_limit int default 20)
returns table (posicion bigint, nombre_grupo text, n_miembros int, total_puntos numeric,
               puntos_por_miembro numeric, racha_duo int, top_clase text, top_stat text)
language sql security definer set search_path = core, pg_temp as $$
  select row_number() over (order by l.puntos_por_miembro desc nulls last, l.total_puntos desc) as posicion,
         l.nombre_grupo, l.n_miembros, l.total_puntos, l.puntos_por_miembro,
         l.racha_duo, l.top_clase, l.top_stat
  from core.leaderboard_duos('2000-01-01'::date, (now() + interval '1 year')::date, 9999, false) l
  join core.tratos t on t.id = l.trato_id
  where t.is_demo
  order by l.puntos_por_miembro desc nulls last, l.total_puntos desc
  limit greatest(p_limit, 1);
$$;
revoke execute on function core.leaderboard_demo(int) from public;
grant  execute on function core.leaderboard_demo(int) to anon, authenticated, service_role;  -- único anon
-- anon necesita USAGE del schema para invocar la función (las tablas siguen sin grant + RLS).
grant usage on schema core to anon;

-- ════════════════════════════════════════════════════════════════════
-- 8 · RPC marcador_reto (lectura en vivo del duelo) — usa puntos_base
-- ════════════════════════════════════════════════════════════════════
create or replace function core.marcador_reto(p_reto_id uuid)
returns table (
  reto_id uuid, estado core.reto_estado, periodo_inicio date, periodo_fin date,
  trato_a uuid, nombre_a text, puntos_a numeric,
  trato_b uuid, nombre_b text, puntos_b numeric,
  lider_trato_id uuid
)
language sql security definer set search_path = core as $$
  with r as (
    select * from core.retos
    where id = p_reto_id
      and (core.is_reto_party(trato_a, trato_b, auth.uid()) or auth.role() = 'service_role')),
  pa as (
    select coalesce(sum(c.puntos_base),0) p
    from r join core.trato_miembros m on m.trato_id = r.trato_a
    left join core.checkins c on c.miembro_id = m.id
      and c.fecha >= r.periodo_inicio and c.fecha < r.periodo_fin),
  pb as (
    select coalesce(sum(c.puntos_base),0) p
    from r join core.trato_miembros m on m.trato_id = r.trato_b
    left join core.checkins c on c.miembro_id = m.id
      and c.fecha >= r.periodo_inicio and c.fecha < r.periodo_fin)
  select r.id, r.estado, r.periodo_inicio, r.periodo_fin,
    r.trato_a, ta.nombre_grupo, pa.p,
    r.trato_b, tb.nombre_grupo, pb.p,
    case when pa.p > pb.p then r.trato_a when pb.p > pa.p then r.trato_b else null end
  from r
  join core.tratos ta on ta.id = r.trato_a
  join core.tratos tb on tb.id = r.trato_b
  cross join pa cross join pb;
$$;
revoke execute on function core.marcador_reto(uuid) from public;
grant  execute on function core.marcador_reto(uuid) to authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- 9 · RPC cerrar_reto (idempotente, fija ganador por puntos_base)
-- ════════════════════════════════════════════════════════════════════
create or replace function core.cerrar_reto(p_reto_id uuid)
returns core.retos
language plpgsql security definer set search_path = core as $$
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

  select coalesce(sum(c.puntos_base),0) into v_a
    from core.trato_miembros m left join core.checkins c on c.miembro_id=m.id
      and c.fecha >= v_reto.periodo_inicio and c.fecha < v_reto.periodo_fin
    where m.trato_id = v_reto.trato_a;
  select coalesce(sum(c.puntos_base),0) into v_b
    from core.trato_miembros m left join core.checkins c on c.miembro_id=m.id
      and c.fecha >= v_reto.periodo_inicio and c.fecha < v_reto.periodo_fin
    where m.trato_id = v_reto.trato_b;

  v_ganador := case when v_a > v_b then v_reto.trato_a when v_b > v_a then v_reto.trato_b else null end;
  update core.retos set estado='cerrado', ganador_trato_id = v_ganador, updated_at = now()
    where id = p_reto_id returning * into v_reto;
  return v_reto;
end; $$;
revoke execute on function core.cerrar_reto(uuid) from public;
grant  execute on function core.cerrar_reto(uuid) to authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- 10 · Grants de tabla (tablas creadas DESPUÉS del grant base 20260519)
-- ════════════════════════════════════════════════════════════════════
grant select, insert, update on core.retos to authenticated;
grant select, insert, update on core.boosts to authenticated;
grant select, insert, update, delete on core.retos to service_role;
grant select, insert, update, delete on core.boosts to service_role;

-- ════════════════════════════════════════════════════════════════════
-- 11 · Endurecer superficie anon. `grant usage on schema core to anon` (§7) hace
--      anon-callable a CUALQUIER función de core con EXECUTE a PUBLIC (default al
--      crearlas). Lo único anon-callable debe ser leaderboard_demo. Revoca los
--      helpers de public/anon; re-otorga a authenticated (las políticas RLS los
--      invocan). guard_is_demo es trigger fn → no requiere grant.
-- ════════════════════════════════════════════════════════════════════
revoke execute on function core.is_trato_member(uuid,uuid) from public;
revoke execute on function core.is_trato_member(uuid,uuid) from anon;
grant  execute on function core.is_trato_member(uuid,uuid) to authenticated, service_role;
revoke execute on function core.owns_miembro(uuid,uuid) from public;
revoke execute on function core.owns_miembro(uuid,uuid) from anon;
grant  execute on function core.owns_miembro(uuid,uuid) to authenticated, service_role;
revoke execute on function core.checkin_visible(uuid,uuid) from public;
revoke execute on function core.checkin_visible(uuid,uuid) from anon;
grant  execute on function core.checkin_visible(uuid,uuid) to authenticated, service_role;
revoke execute on function core.guard_is_demo() from public;
revoke execute on function core.guard_is_demo() from anon;
