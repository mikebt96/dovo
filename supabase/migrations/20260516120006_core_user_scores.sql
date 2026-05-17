-- core.user_scores: vanity metric de cumplimiento agregado.
-- Default hidden (decisión spec 11.1).

create type core.score_visibility as enum ('hidden', 'duos_con_trato', 'publico');

create table core.user_scores (
  user_id uuid primary key references core.users(id) on delete cascade,
  tratos_cerrados int not null default 0,
  tratos_cumplidos int not null default 0,
  score_publico int generated always as (
    case when tratos_cerrados = 0 then 0
    else round((tratos_cumplidos::numeric / tratos_cerrados) * 1000)::int
    end
  ) stored,
  visibility core.score_visibility not null default 'hidden',
  updated_at timestamptz not null default now()
);

comment on table core.user_scores is 'Score de cumplimiento del usuario. visibility hidden por default (decisión spec 11.1).';
comment on column core.user_scores.score_publico is '0–1000. Calculado automáticamente como tratos_cumplidos/tratos_cerrados * 1000.';

create trigger user_scores_updated_at
  before update on core.user_scores
  for each row execute function core.set_updated_at();

alter table core.user_scores enable row level security;

-- Cada user puede leer su propio score siempre
create policy scores_read_own on core.user_scores
  for select using (auth.uid() = user_id);

-- Score visible para dúos con trato compartido (cuando visibility = duos_con_trato)
create policy scores_read_duo on core.user_scores
  for select using (
    visibility in ('duos_con_trato', 'publico')
    and (
      visibility = 'publico'
      or auth.uid() in (
        select creator_id from core.tratos where partner_id = user_scores.user_id
        union
        select partner_id from core.tratos where creator_id = user_scores.user_id
      )
    )
  );

-- Solo el user puede modificar su visibility
create policy scores_update_own on core.user_scores
  for update using (auth.uid() = user_id);
