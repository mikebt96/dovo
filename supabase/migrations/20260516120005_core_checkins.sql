-- core.checkins: self-report del cumplimiento + flag de disputa del otro.

create table core.checkins (
  id uuid primary key default gen_random_uuid(),
  trato_id uuid not null references core.tratos(id) on delete cascade,
  user_id uuid not null references core.users(id) on delete restrict,
  fecha date not null,
  cumplido boolean not null,
  nota text check (nota is null or length(nota) <= 280),
  -- Disputa por el otro miembro del dúo (decisión spec 11.3)
  disputed_by uuid references core.users(id),
  disputed_reason text check (
    disputed_reason is null or length(disputed_reason) between 10 and 280
  ),
  disputed_at timestamptz,
  created_at timestamptz not null default now(),
  -- Constraint: si hay dispute, requiere los 3 campos
  constraint dispute_complete check (
    (disputed_by is null and disputed_reason is null and disputed_at is null) or
    (disputed_by is not null and disputed_reason is not null and disputed_at is not null)
  ),
  -- Un user no puede tener dos checkins en el mismo trato el mismo día
  unique (trato_id, user_id, fecha)
);

create index checkins_trato_idx on core.checkins(trato_id);
create index checkins_user_idx on core.checkins(user_id);
create index checkins_fecha_idx on core.checkins(fecha);

comment on table core.checkins is 'Self-report de cumplimiento. disputed_by permite que el otro miembro del dúo flag el día como en disputa (decisión spec 11.3).';

alter table core.checkins enable row level security;

-- Miembros del trato pueden leer todos los checkins del trato
create policy checkins_read_trato_members on core.checkins
  for select using (
    auth.uid() in (
      select creator_id from core.tratos where id = trato_id
      union
      select partner_id from core.tratos where id = trato_id
    )
  );

-- Solo el user puede insertar su propio checkin
create policy checkins_insert_self on core.checkins
  for insert with check (auth.uid() = user_id);

-- Update: el user puede editar su propio checkin (cumplido/nota)
--         o el otro miembro puede setear disputed_*
create policy checkins_update_self_or_dispute on core.checkins
  for update using (
    auth.uid() = user_id
    or auth.uid() in (
      select creator_id from core.tratos where id = trato_id
      union
      select partner_id from core.tratos where id = trato_id
    )
  );
