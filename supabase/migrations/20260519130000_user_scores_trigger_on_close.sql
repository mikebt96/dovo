-- Cierre de trato → bump automático de user_scores para ambos miembros.
-- creator_cumplio / partner_cumplio se setean por resolveTrato server action
-- antes del UPDATE que transiciona a estado='cerrado'.

alter table core.tratos
  add column if not exists creator_cumplio boolean,
  add column if not exists partner_cumplio boolean;

create or replace function core.bump_user_score()
returns trigger as $$
begin
  if (old.estado is distinct from 'cerrado' and new.estado = 'cerrado') then
    insert into core.user_scores (user_id, tratos_cerrados, tratos_cumplidos)
    values (
      new.creator_id,
      1,
      case when coalesce(new.creator_cumplio, false) then 1 else 0 end
    )
    on conflict (user_id) do update set
      tratos_cerrados = core.user_scores.tratos_cerrados + 1,
      tratos_cumplidos = core.user_scores.tratos_cumplidos +
        case when coalesce(new.creator_cumplio, false) then 1 else 0 end,
      updated_at = now();

    if new.partner_id is not null then
      insert into core.user_scores (user_id, tratos_cerrados, tratos_cumplidos)
      values (
        new.partner_id,
        1,
        case when coalesce(new.partner_cumplio, false) then 1 else 0 end
      )
      on conflict (user_id) do update set
        tratos_cerrados = core.user_scores.tratos_cerrados + 1,
        tratos_cumplidos = core.user_scores.tratos_cumplidos +
          case when coalesce(new.partner_cumplio, false) then 1 else 0 end,
        updated_at = now();
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = core, public;

drop trigger if exists trato_cerrado_bumps_score on core.tratos;
create trigger trato_cerrado_bumps_score
  after update of estado on core.tratos
  for each row execute function core.bump_user_score();

comment on function core.bump_user_score is 'Bumpea user_scores al transicionar trato a cerrado. SECURITY DEFINER para bypassar RLS de user_scores (no tiene policy de INSERT directo).';
