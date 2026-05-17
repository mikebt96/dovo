-- core.users: perfil del usuario, ligado 1:1 con auth.users via id.

create table core.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombre text not null,
  pulse_opt_out boolean not null default false,
  access_channel text not null check (access_channel in ('curated', 'fcfs')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table core.users is 'Perfil del usuario. id == auth.users.id. pulse_opt_out controla si los eventos del usuario alimentan pulse.';
comment on column core.users.access_channel is 'curated = invitación 1-a-1 por Miguel · fcfs = primer-en-llegar via form público';

-- Trigger para updated_at
create or replace function core.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on core.users
  for each row execute function core.set_updated_at();

-- RLS desde el inicio (políticas las define el código de aplicación)
alter table core.users enable row level security;

-- Policy: cada user puede leer su propio row vía auth.uid()
create policy users_read_own on core.users
  for select using (auth.uid() = id);

-- Policy: cada user puede actualizar su propio row
create policy users_update_own on core.users
  for update using (auth.uid() = id);

-- Policy: service_role bypassea (manejado por Supabase automáticamente con service_role_key)
