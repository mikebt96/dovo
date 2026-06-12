-- ════════════════════════════════════════════════════════════════════
-- F24 · OPT-OUT PEGAJOSO A NIVEL TRATO (hallazgo de la revisión adversarial
-- de inteligencia de premios, 2026-06-12): la exclusión por pulse_opt_out
-- usaba la membresía ACTUAL — si el miembro opted-out dejaba el dúo (o se
-- borraba), su histórico REINGRESABA al agregado. El flag pegajoso vive en
-- el trato: una vez excluido, excluido para siempre (conservador a propósito;
-- volver a optar-in NO re-incluye el histórico del trato).
-- ════════════════════════════════════════════════════════════════════

alter table core.tratos add column if not exists pulse_excluido boolean not null default false;

-- Backfill: tratos con algún miembro opted-out HOY quedan marcados ya.
update core.tratos t
   set pulse_excluido = true
 where pulse_excluido = false
   and exists (
     select 1
     from core.trato_miembros m
     join core.users u on u.id = m.user_id
     where m.trato_id = t.id and u.pulse_opt_out = true
   );

-- Camino 1: un usuario se opta-out → TODOS sus tratos quedan excluidos.
create or replace function core.pulse_excluir_tratos_del_user()
returns trigger
language plpgsql
security definer
set search_path = core
as $$
begin
  update core.tratos t
     set pulse_excluido = true
   where pulse_excluido = false
     and exists (
       select 1 from core.trato_miembros m
       where m.trato_id = t.id and m.user_id = new.id
     );
  return new;
end;
$$;

drop trigger if exists users_pulse_opt_out_sticky on core.users;
create trigger users_pulse_opt_out_sticky
  after update of pulse_opt_out on core.users
  for each row
  when (new.pulse_opt_out = true)
  execute function core.pulse_excluir_tratos_del_user();

-- Camino 2: un usuario YA opted-out se une a un trato → ese trato queda fuera.
create or replace function core.pulse_excluir_al_unirse()
returns trigger
language plpgsql
security definer
set search_path = core
as $$
begin
  if exists (
    select 1 from core.users u
    where u.id = new.user_id and u.pulse_opt_out = true
  ) then
    update core.tratos set pulse_excluido = true
     where id = new.trato_id and pulse_excluido = false;
  end if;
  return new;
end;
$$;

drop trigger if exists miembros_pulse_sticky on core.trato_miembros;
create trigger miembros_pulse_sticky
  after insert on core.trato_miembros
  for each row
  execute function core.pulse_excluir_al_unirse();
