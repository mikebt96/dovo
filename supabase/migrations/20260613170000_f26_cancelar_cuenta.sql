-- ════════════════════════════════════════════════════════════════════
-- F26 · CANCELAR CUENTA (aviso v1.0 §13 lo promete: "desde Ajustes,
-- eliminación en ≤30 días" — aquí la eliminación es INMEDIATA, mejor que
-- lo prometido).
--
-- Diseño tombstone: tratos/retos/apuestas.created_by son ON DELETE RESTRICT,
-- así que la fila de core.users NO puede borrarse — se conserva ANONIMIZADA
-- (el "bloqueo" del aviso §13). Todo lo demás del usuario se borra de verdad.
-- La bitácora de consentimientos SE CONSERVA: es evidencia legal.
-- El baneo del login (auth) lo hace la app vía admin API tras el RPC.
-- ════════════════════════════════════════════════════════════════════

alter table core.users add column if not exists cancelada_at timestamptz;

create or replace function core.cancelar_cuenta()
returns void
language plpgsql
security definer
set search_path = core
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUERIDA';
  end if;

  -- 1 · salud y nutrición (espejo de purgar_salud_revocada, inmediato)
  delete from core.actividad_metricas am
  using core.checkins c, core.trato_miembros m
  where am.checkin_id = c.id and c.miembro_id = m.id and m.user_id = v_uid;
  delete from core.molestias where user_id = v_uid;
  delete from core.body_scans where user_id = v_uid;
  delete from core.food_logs where user_id = v_uid;
  delete from core.meal_plans where user_id = v_uid;
  delete from core.nutrition_profiles where user_id = v_uid;
  delete from core.fuentes_salud where user_id = v_uid;
  delete from core.user_perfil_fisico where user_id = v_uid;

  -- 2 · tombstone ANTES de borrar membresías: pulse_opt_out=true dispara la
  -- exclusión pegajosa de sus tratos mientras la membresía aún existe
  update core.users
     set nombre = 'cuenta cancelada',
         email = 'cancelada+' || left(v_uid::text, 8) || '@dovofit.com',
         pulse_opt_out = true,
         cancelada_at = now()
   where id = v_uid;

  -- 3 · juego, dispositivos y geo
  delete from core.lugares where user_id = v_uid;
  delete from core.push_subscriptions where user_id = v_uid;
  delete from core.notification_prefs where user_id = v_uid;
  delete from core.wishlist where user_id = v_uid;
  delete from core.boosts where de_user = v_uid or para_user = v_uid;
  delete from core.ataques where de_user = v_uid;
  delete from core.veredictos_vistos where user_id = v_uid;
  delete from core.user_character where user_id = v_uid;
  delete from core.user_streak where user_id = v_uid;
  -- membresías al final: la cascada borra sus checkins y rutinas
  delete from core.trato_miembros where user_id = v_uid;

  -- 4 · tratos que creó y quedaron sin miembros → archivados
  update core.tratos t
     set estado = 'archivado'
   where t.created_by = v_uid
     and t.estado = 'activo'
     and not exists (select 1 from core.trato_miembros m where m.trato_id = t.id);
end;
$$;

revoke all on function core.cancelar_cuenta() from public, anon;
grant execute on function core.cancelar_cuenta() to authenticated, service_role;
