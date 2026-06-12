-- ════════════════════════════════════════════════════════════════════
-- F24 · JOIN SOLO POR CÓDIGO (decisión del founder 2026-06-12):
-- "ya sea para una pareja o un grupo debes tener un código que te permita
-- ligarte únicamente a la persona o grupo que quieres".
--
-- Dos bugs muertos de un tiro:
-- 1) HOYO RLS: miembros_insert_self permitía insertarse a CUALQUIER trato
--    con un request directo a PostgREST (la app exigía token, la DB no).
-- 2) BUG LATENTE: unirseAGrupo buscaba el trato por token con el cliente
--    del usuario — un extraño no puede LEER tratos por RLS, así que el
--    lookup devolvía vacío ("grupo no existe") para todo no-miembro.
--
-- El RPC SECURITY DEFINER valida token + cupo por tipo (G21: pareja=2,
-- pequeño=6, grande sin tope) e inserta — la ÚNICA puerta de entrada.
-- NO toca la maquinaria del Veredicto (cerrar_semana_rachas/cerrar_apuestas).
-- ════════════════════════════════════════════════════════════════════

create or replace function core.unirse_con_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = core
as $$
declare
  v_trato core.tratos%rowtype;
  v_cap int;
  v_count int;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUERIDA';
  end if;

  -- for update: serializa joins concurrentes al mismo trato (el cupo no se
  -- puede rebasar por carrera)
  select * into v_trato from core.tratos where invite_token = p_token for update;
  if not found then
    raise exception 'GRUPO_NO_EXISTE';
  end if;
  if v_trato.estado <> 'activo' then
    raise exception 'GRUPO_INACTIVO';
  end if;

  if exists (
    select 1 from core.trato_miembros
    where trato_id = v_trato.id and user_id = v_uid
  ) then
    raise exception 'YA_MIEMBRO';
  end if;

  v_cap := case v_trato.tipo_grupo
    when 'pareja' then 2
    when 'pequeno' then 6
    else null -- grande: sin tope
  end;
  if v_cap is not null then
    select count(*) into v_count from core.trato_miembros where trato_id = v_trato.id;
    if v_count >= v_cap then
      raise exception 'GRUPO_LLENO';
    end if;
  end if;

  insert into core.trato_miembros (trato_id, user_id, role)
  values (v_trato.id, v_uid, 'member');

  return v_trato.id;
end;
$$;

revoke all on function core.unirse_con_token(text) from public, anon;
grant execute on function core.unirse_con_token(text) to authenticated, service_role;

-- Cerrar el hoyo: el insert directo queda SOLO para el creador en SU propio
-- trato (crearGrupo lo necesita para sembrarse como 'creator'); todo lo
-- demás entra por el RPC con token.
drop policy if exists miembros_insert_self on core.trato_miembros;
drop policy if exists miembros_insert_creator_self on core.trato_miembros;
create policy miembros_insert_creator_self on core.trato_miembros
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from core.tratos t
      where t.id = trato_id and t.created_by = auth.uid()
    )
  );

-- Hardening adicional: NINGÚN código de cliente actualiza core.tratos hoy
-- (verificado por grep) — revocar UPDATE cierra el tampering de invite_token
-- y de flags por PostgREST directo. Si algún día llega "archivar grupo",
-- se re-otorga por columna explícita.
revoke update on core.tratos from authenticated;
