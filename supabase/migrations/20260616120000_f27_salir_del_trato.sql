-- ════════════════════════════════════════════════════════════════════
-- F27 · SALIR DE UN GRUPO (UX pedida por el founder). Existía la policy
-- miembros_delete_self pero ningún flujo: salir limpio necesita además
-- archivar el trato cuando queda vacío y cuidar el caso del creador.
--
-- RPC SECURITY DEFINER (la puerta única, como unirse_con_token):
--   · borra tu membresía (cascada limpia tus checkins/rutinas de ESE trato)
--   · si el trato queda sin miembros → se archiva (no se borra: tratos.
--     created_by es RESTRICT y la apuesta/histórico cuelgan de él)
--   · el creador puede salir; created_by sigue apuntando a su users row
--     (que persiste), así que no rompe FK ni hace falta transferir
-- La apuesta viva de la semana queda intacta; el cron de cierre ya tolera
-- un trato con <2 miembros (no asigna perdedor si falta el marcador).
-- ════════════════════════════════════════════════════════════════════

create or replace function core.salir_del_trato(p_trato_id uuid)
returns void
language plpgsql
security definer
set search_path = core
as $$
declare
  v_uid uuid := auth.uid();
  v_es_miembro boolean;
  v_restantes int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUERIDA';
  end if;

  select exists(
    select 1 from core.trato_miembros where trato_id = p_trato_id and user_id = v_uid
  ) into v_es_miembro;
  if not v_es_miembro then
    raise exception 'NO_MIEMBRO';
  end if;

  delete from core.trato_miembros where trato_id = p_trato_id and user_id = v_uid;

  select count(*) into v_restantes from core.trato_miembros where trato_id = p_trato_id;
  if v_restantes = 0 then
    update core.tratos set estado = 'archivado' where id = p_trato_id;
  end if;
end;
$$;

revoke all on function core.salir_del_trato(uuid) from public, anon;
grant execute on function core.salir_del_trato(uuid) to authenticated, service_role;
