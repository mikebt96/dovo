-- F10 · Ataques entre dúos rivales (spec §3.16: golpes/congelamientos, NUNCA al propio dúo).
-- Diseño Hook: la munición se gana entrenando (check-in de hoy), el escudo rival es la
-- recompensa variable (no sabes si lo tienen), y SOLO se afecta el marcador del duelo —
-- stats personales, leaderboard global y rachas quedan intactos.

-- ── Tabla ──
create table if not exists core.ataques (
  id uuid primary key default gen_random_uuid(),
  reto_id uuid not null references core.retos(id) on delete cascade,
  de_user uuid not null references core.users(id) on delete cascade,
  de_trato uuid not null references core.tratos(id) on delete cascade,
  para_trato uuid not null references core.tratos(id) on delete cascade,
  para_user uuid references core.users(id) on delete set null, -- congelamiento apunta a un miembro
  tipo text not null check (tipo in ('golpe','congelamiento')),
  resultado text not null check (resultado in ('impacto','bloqueado')),
  puntos numeric not null default 0 check (puntos >= 0),
  congela_hasta timestamptz,
  created_at timestamptz not null default now(),
  constraint ataques_regla_de_oro check (de_trato <> para_trato)
);
create index if not exists ataques_reto_idx on core.ataques(reto_id, created_at desc);
create index if not exists ataques_congelado_idx on core.ataques(reto_id, para_user)
  where tipo = 'congelamiento' and resultado = 'impacto';

alter table core.ataques enable row level security;

-- SELECT: las dos partes del duelo ven el historial. INSERT: SOLO vía RPC (security definer).
drop policy if exists ataques_read_parties on core.ataques;
create policy ataques_read_parties on core.ataques for select to authenticated
  using (exists (
    select 1 from core.retos r
    where r.id = reto_id and core.is_reto_party(r.trato_a, r.trato_b, auth.uid())
  ));

grant usage on schema core to authenticated;
grant select on core.ataques to authenticated;
grant select, insert, update, delete on core.ataques to service_role;

-- ── Matemática compartida del duelo: golpes restan, congelados no suman ──
-- La usan marcador_reto (lo que VES) y cerrar_reto (quién GANA): misma fórmula siempre.
create or replace function core.puntos_reto(p_reto_id uuid, p_trato uuid)
returns numeric
language sql security definer stable set search_path = core, pg_temp as $$
  select greatest(0, coalesce(base.p, 0) - coalesce(golpes.g, 0))
  from
    (select sum(c.puntos_base) p
       from core.retos r
       join core.trato_miembros m on m.trato_id = p_trato
       join core.checkins c on c.miembro_id = m.id
        and c.fecha >= r.periodo_inicio and c.fecha < r.periodo_fin
      where r.id = p_reto_id
        and not exists (
          select 1 from core.ataques x
          where x.reto_id = r.id and x.tipo = 'congelamiento' and x.resultado = 'impacto'
            and x.para_user = m.user_id
            and c.created_at >= x.created_at and c.created_at <= x.congela_hasta
        )) base,
    (select sum(x.puntos) g
       from core.ataques x
      where x.reto_id = p_reto_id and x.para_trato = p_trato
        and x.tipo = 'golpe' and x.resultado = 'impacto') golpes;
$$;
revoke execute on function core.puntos_reto(uuid, uuid) from public;
revoke execute on function core.puntos_reto(uuid, uuid) from anon;
grant execute on function core.puntos_reto(uuid, uuid) to authenticated, service_role;

-- ── marcador_reto v2 (misma firma; ahora con ataques aplicados) ──
create or replace function core.marcador_reto(p_reto_id uuid)
returns table (
  reto_id uuid, estado core.reto_estado, periodo_inicio date, periodo_fin date,
  trato_a uuid, nombre_a text, puntos_a numeric,
  trato_b uuid, nombre_b text, puntos_b numeric,
  lider_trato_id uuid
)
language sql security definer set search_path = core, pg_temp as $$
  with r as (
    select * from core.retos
    where id = p_reto_id
      and (core.is_reto_party(trato_a, trato_b, auth.uid()) or auth.role() = 'service_role')),
  pts as (
    select core.puntos_reto(r.id, r.trato_a) pa, core.puntos_reto(r.id, r.trato_b) pb from r)
  select r.id, r.estado, r.periodo_inicio, r.periodo_fin,
    r.trato_a, ta.nombre_grupo, pts.pa,
    r.trato_b, tb.nombre_grupo, pts.pb,
    case when pts.pa > pts.pb then r.trato_a when pts.pb > pts.pa then r.trato_b else null end
  from r
  join core.tratos ta on ta.id = r.trato_a
  join core.tratos tb on tb.id = r.trato_b
  cross join pts;
$$;
revoke execute on function core.marcador_reto(uuid) from public;
revoke execute on function core.marcador_reto(uuid) from anon;
grant execute on function core.marcador_reto(uuid) to authenticated, service_role;

-- ── cerrar_reto v2: el ganador se fija con LA MISMA matemática del marcador ──
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

-- ── RPC lanzar_ataque: TODA la lógica de negocio, atómica (sin carreras de escudo/límite) ──
create or replace function core.lanzar_ataque(p_reto_id uuid, p_tipo text, p_para_user uuid default null)
returns core.ataques
language plpgsql security definer set search_path = core, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_reto core.retos;
  v_mi_trato uuid;
  v_rival uuid;
  v_hoy date := (now() at time zone 'America/Mexico_City')::date;
  v_es_demo boolean;
  v_escudo_id uuid;
  v_resultado text;
  v_puntos numeric := 0;
  v_congela timestamptz := null;
  v_row core.ataques;
begin
  if v_uid is null then raise exception 'sin sesión'; end if;
  if p_tipo not in ('golpe','congelamiento') then raise exception 'tipo inválido'; end if;

  select * into v_reto from core.retos where id = p_reto_id for update;
  if v_reto.id is null then raise exception 'reto no existe'; end if;
  if v_reto.estado <> 'activo' then raise exception 'el duelo no está activo'; end if;
  if v_hoy < v_reto.periodo_inicio or v_hoy >= v_reto.periodo_fin then
    raise exception 'el duelo no está en curso';
  end if;

  -- Mi lado del duelo (y regla de oro implícita: el rival siempre es EL OTRO trato).
  select case
    when exists(select 1 from core.trato_miembros where trato_id = v_reto.trato_a and user_id = v_uid) then v_reto.trato_a
    when exists(select 1 from core.trato_miembros where trato_id = v_reto.trato_b and user_id = v_uid) then v_reto.trato_b
  end into v_mi_trato;
  if v_mi_trato is null then raise exception 'no eres parte de este duelo'; end if;
  v_rival := case when v_mi_trato = v_reto.trato_a then v_reto.trato_b else v_reto.trato_a end;

  -- Congelamiento apunta a un miembro concreto del rival.
  if p_tipo = 'congelamiento' then
    if p_para_user is null or not exists(
      select 1 from core.trato_miembros where trato_id = v_rival and user_id = p_para_user) then
      raise exception 'objetivo inválido';
    end if;
  else
    p_para_user := null; -- golpe es al dúo, no a un miembro
  end if;

  -- Munición Hook: tu ataque de hoy se GANA entrenando hoy. Dúos demo exentos (recorrido
  -- del inversionista nunca topa el candado).
  select t.is_demo into v_es_demo from core.tratos t where t.id = v_mi_trato;
  if not coalesce(v_es_demo, false) and not exists (
    select 1 from core.checkins c
    join core.trato_miembros m on m.id = c.miembro_id
    where m.trato_id = v_mi_trato and m.user_id = v_uid and c.fecha = v_hoy) then
    raise exception 'entrena hoy para desbloquear tu ataque';
  end if;

  -- Límite: 1 ataque por miembro por día en este duelo.
  if exists (
    select 1 from core.ataques a
    where a.reto_id = p_reto_id and a.de_user = v_uid
      and (a.created_at at time zone 'America/Mexico_City')::date = v_hoy) then
    raise exception 'ya atacaste hoy — mañana hay revancha';
  end if;

  -- Escudo del dúo rival: bloquea CUALQUIER ataque y se consume (recompensa variable).
  select b.id into v_escudo_id
    from core.boosts b
   where b.trato_id = v_rival and b.tipo = 'escudo'
     and b.aplicado = false and b.fecha_expira > now()
   order by b.fecha_otorgado asc
   limit 1
   for update;
  if v_escudo_id is not null then
    update core.boosts set aplicado = true where id = v_escudo_id;
    v_resultado := 'bloqueado';
  else
    v_resultado := 'impacto';
    if p_tipo = 'golpe' then
      v_puntos := 10;
    else
      v_congela := now() + interval '12 hours';
    end if;
  end if;

  insert into core.ataques (reto_id, de_user, de_trato, para_trato, para_user, tipo, resultado, puntos, congela_hasta)
  values (p_reto_id, v_uid, v_mi_trato, v_rival, p_para_user, p_tipo, v_resultado, v_puntos, v_congela)
  returning * into v_row;
  return v_row;
end; $$;
revoke execute on function core.lanzar_ataque(uuid, text, uuid) from public;
revoke execute on function core.lanzar_ataque(uuid, text, uuid) from anon;
grant execute on function core.lanzar_ataque(uuid, text, uuid) to authenticated, service_role;

-- ── Nombres de los participantes del duelo (picker de congelamiento + feed) ──
-- La RLS de core.users solo permite co-miembros; las partes del reto necesitan
-- los nombres del rival. Gated por is_reto_party — nada anon, cero PII extra.
create or replace function core.miembros_reto(p_reto_id uuid)
returns table (user_id uuid, nombre text, trato_id uuid)
language sql security definer stable set search_path = core, pg_temp as $$
  select u.id, u.nombre, m.trato_id
  from core.retos r
  join core.trato_miembros m on m.trato_id in (r.trato_a, r.trato_b)
  join core.users u on u.id = m.user_id
  where r.id = p_reto_id
    and (core.is_reto_party(r.trato_a, r.trato_b, auth.uid()) or auth.role() = 'service_role');
$$;
revoke execute on function core.miembros_reto(uuid) from public;
revoke execute on function core.miembros_reto(uuid) from anon;
grant execute on function core.miembros_reto(uuid) to authenticated, service_role;
