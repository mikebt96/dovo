-- F10b · Hardening del review adversarial (2026-06-10).
--
-- 1 · El ALTER DEFAULT PRIVILEGES de 20260519 otorga INSERT/UPDATE implícito a
--     authenticated sobre TODA tabla nueva de core — core.ataques lo heredó y la
--     invariante "INSERT solo vía RPC" dependía únicamente del deny-by-default de RLS.
--     El ledger del duelo queda blindado aunque alguien toque RLS a futuro.
revoke insert, update, delete on core.ataques from authenticated;

-- 2 · puntos_reto es SECURITY DEFINER sin gate propio (el gate vive en marcador_reto/
--     cerrar_reto); authenticated no necesita EXECUTE directo — la cadena definer corre
--     como owner. Sin esto, cualquier authenticated podía consultar marcadores ajenos
--     por UUID (fuga teórica: los UUID no son adivinables, pero el modelo debe ser limpio).
revoke execute on function core.puntos_reto(uuid, uuid) from authenticated;

-- 3 · Invariante de datos: un congelamiento con impacto SIEMPRE lleva ventana.
--     (Una fila de service_role sin congela_hasta haría fail-open el not-exists.)
alter table core.ataques drop constraint if exists ataques_congela_coherente;
alter table core.ataques add constraint ataques_congela_coherente
  check (tipo <> 'congelamiento' or resultado <> 'impacto' or congela_hasta is not null);

-- 4 · Regla de oro reforzada: si un usuario pertenece a AMBOS dúos del duelo (posible:
--     un user puede estar en varios dúos), no puede atacar al dúo del que también es parte.
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

  select case
    when exists(select 1 from core.trato_miembros where trato_id = v_reto.trato_a and user_id = v_uid) then v_reto.trato_a
    when exists(select 1 from core.trato_miembros where trato_id = v_reto.trato_b and user_id = v_uid) then v_reto.trato_b
  end into v_mi_trato;
  if v_mi_trato is null then raise exception 'no eres parte de este duelo'; end if;
  v_rival := case when v_mi_trato = v_reto.trato_a then v_reto.trato_b else v_reto.trato_a end;

  -- Regla de oro completa: jamás contra un dúo del que TAMBIÉN eres miembro.
  if exists(select 1 from core.trato_miembros where trato_id = v_rival and user_id = v_uid) then
    raise exception 'no puedes atacar un dúo del que eres parte';
  end if;

  if p_tipo = 'congelamiento' then
    if p_para_user is null or not exists(
      select 1 from core.trato_miembros where trato_id = v_rival and user_id = p_para_user) then
      raise exception 'objetivo inválido';
    end if;
  else
    p_para_user := null;
  end if;

  select t.is_demo into v_es_demo from core.tratos t where t.id = v_mi_trato;
  if not coalesce(v_es_demo, false) and not exists (
    select 1 from core.checkins c
    join core.trato_miembros m on m.id = c.miembro_id
    where m.trato_id = v_mi_trato and m.user_id = v_uid and c.fecha = v_hoy) then
    raise exception 'entrena hoy para desbloquear tu ataque';
  end if;

  if exists (
    select 1 from core.ataques a
    where a.reto_id = p_reto_id and a.de_user = v_uid
      and (a.created_at at time zone 'America/Mexico_City')::date = v_hoy) then
    raise exception 'ya atacaste hoy — mañana hay revancha';
  end if;

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
