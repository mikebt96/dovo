-- F10c · Boosts: INSERT solo vía RPC (cierra el bypass de PostgREST).
--
-- El gating de racha (≥ 2 semanas) y el cooldown (1 boost por emisor por dúo cada
-- 7 días) vivían SOLO en la server action darBoost (lib/actions/boosts.ts); la
-- política boosts_insert_giver únicamente validaba membresía y de<>para, así que
-- cualquier authenticated podía insertar boosts ilimitados con supabase-js directo:
-- escudos infinitos = inmunidad total a los ataques de F10 (lanzar_ataque consume
-- escudos de core.boosts) y energía infinita infla las stats del personaje.
-- Mismo patrón que core.ataques (20260610030000/40000): toda la lógica de negocio
-- en un RPC SECURITY DEFINER atómico, cero INSERT directo de clientes.

-- ── RPC dar_boost: membresía + gating + cooldown + insert, atómico ──
create or replace function core.dar_boost(p_para_user uuid, p_trato_id uuid, p_tipo text)
returns core.boosts
language plpgsql security definer set search_path = core, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_horas int;
  v_row core.boosts;
begin
  if v_uid is null then raise exception 'sin sesión'; end if;
  if p_tipo not in ('energia','escudo') then raise exception 'tipo inválido'; end if;
  if v_uid = p_para_user then raise exception 'el boost es para tu dúo, no para ti'; end if;
  if not core.is_trato_member(p_trato_id, v_uid)
     or not core.is_trato_member(p_trato_id, p_para_user) then
    raise exception 'no eres parte de este dúo';
  end if;

  -- Serializa por (emisor, dúo): dos requests simultáneos del mismo emisor no
  -- pueden pasar ambos el check de cooldown antes de que el otro inserte.
  perform pg_advisory_xact_lock(
    hashtextextended('dar_boost:' || v_uid::text || ':' || p_trato_id::text, 0));

  -- Gating: racha del dúo ≥ 2 semanas.                        -- BOOST_GATING_RACHAS
  if coalesce((select current_streak_weeks from core.trato_streak
               where trato_id = p_trato_id), 0) < 2 then
    raise exception 'desbloquea boosts con una racha de 2 semanas';
  end if;

  -- Cooldown: 1 boost por emisor por dúo cada 7 días.
  if exists (
    select 1 from core.boosts b
    where b.de_user = v_uid and b.trato_id = p_trato_id
      and b.fecha_otorgado > now() - interval '7 days') then
    raise exception 'ya regalaste un boost esta semana';
  end if;

  -- energía: vence en 24h (próximo check-in). escudo: protege la semana (~7d).
  v_horas := case when p_tipo = 'energia' then 24 else 24 * 7 end;

  insert into core.boosts (de_user, para_user, trato_id, tipo, fecha_expira)
  values (v_uid, p_para_user, p_trato_id, p_tipo::core.boost_tipo,
          now() + make_interval(hours => v_horas))
  returning * into v_row;
  return v_row;
end; $$;
revoke execute on function core.dar_boost(uuid, uuid, text) from public;
revoke execute on function core.dar_boost(uuid, uuid, text) from anon;
grant execute on function core.dar_boost(uuid, uuid, text) to authenticated, service_role;

-- ── Cero INSERT/UPDATE directo de clientes ──
-- Revoke explícito: el grant de la fase BC (20260607) + el ALTER DEFAULT PRIVILEGES
-- de 20260519 daban INSERT/UPDATE a authenticated. SELECT se queda (badge en home y
-- estado gate/cooldown del botón). 'aplicado' lo mueven apply_checkin/lanzar_ataque
-- (definer, corren como owner). El seed demo corre como postgres/service_role: intacto.
revoke insert, update on core.boosts from authenticated;
drop policy if exists boosts_insert_giver on core.boosts;
