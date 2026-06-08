-- core.users tenía RLS solo-propio (users_read_own), así que un miembro NO podía leer el
-- nombre de su co-miembro → el join `users!inner(nombre)` en grupo/[id] descartaba al partner
-- ("miembros (1)") y el badge de boost no mostraba quién lo regaló. Latente con 0 usuarios reales.
-- Fix: co-miembros del mismo trato pueden leerse entre sí (SELECT). Helper SECURITY DEFINER
-- para evitar recursión de RLS sobre trato_miembros.
create or replace function core.shares_trato(p_other uuid, p_me uuid)
returns boolean language sql security definer stable set search_path = core as $$
  select exists(
    select 1
    from core.trato_miembros me
    join core.trato_miembros otro on otro.trato_id = me.trato_id
    where me.user_id = p_me and otro.user_id = p_other
  );
$$;
revoke execute on function core.shares_trato(uuid,uuid) from public;
grant execute on function core.shares_trato(uuid,uuid) to authenticated, service_role;

drop policy if exists users_read_comember on core.users;
create policy users_read_comember on core.users for select
  using (core.shares_trato(id, auth.uid()));
