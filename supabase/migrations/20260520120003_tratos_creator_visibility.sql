-- Fix: crearGrupo() inserta en core.tratos con .insert().select(). Postgres
-- aplica la policy de SELECT al RETURNING, pero la policy original solo permite
-- a miembros (is_trato_member). En el instante del insert el creador todavía NO
-- está en core.trato_miembros (esa fila se inserta después), así que el
-- RETURNING queda invisible y PostgREST lo reporta como
-- "new row violates row-level security policy for table tratos".
--
-- Arreglo: el creador siempre puede ver y administrar los grupos que creó.
-- Aditivo y seguro (no quita visibilidad a nadie).

drop policy if exists tratos_read_member on core.tratos;
create policy tratos_read_member on core.tratos
  for select using (core.is_trato_member(id, auth.uid()) or created_by = auth.uid());

drop policy if exists tratos_update_member on core.tratos;
create policy tratos_update_member on core.tratos
  for update using (core.is_trato_member(id, auth.uid()) or created_by = auth.uid());
