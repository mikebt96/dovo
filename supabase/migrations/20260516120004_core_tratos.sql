-- core.tratos: el trato entre dos personas.

create type core.trato_estado as enum ('pendiente_aceptacion', 'activo', 'cerrado', 'disputado');
create type core.trato_resultado as enum ('ambos_cumplieron', 'uno_fallo', 'ambos_fallaron', 'sin_resolver');

create table core.tratos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references core.users(id) on delete restrict,
  partner_id uuid not null references core.users(id) on delete restrict,
  goal text not null check (length(goal) between 3 and 500),
  frecuencia text not null,
  duracion_dias int not null check (duracion_dias between 1 and 365),
  recompensa_text text not null check (length(recompensa_text) between 1 and 500),
  castigo_text text not null check (length(castigo_text) between 1 and 500),
  estado core.trato_estado not null default 'pendiente_aceptacion',
  resultado core.trato_resultado,
  sponsored_id uuid,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint creator_ne_partner check (creator_id != partner_id)
);

create index tratos_creator_idx on core.tratos(creator_id);
create index tratos_partner_idx on core.tratos(partner_id);
create index tratos_estado_idx on core.tratos(estado);

create trigger tratos_updated_at
  before update on core.tratos
  for each row execute function core.set_updated_at();

comment on table core.tratos is 'Trato entre dos usuarios. Solo dúos (creator != partner). Recompensa/castigo en texto libre, ejecutados off-platform.';
comment on column core.tratos.sponsored_id is 'FK a core.sponsored_tratos cuando este trato pertenece a una campaña patrocinada.';

alter table core.tratos enable row level security;

-- Cada miembro del dúo puede leer sus tratos
create policy tratos_read_member on core.tratos
  for select using (auth.uid() in (creator_id, partner_id));

-- Solo creator puede crear el trato
create policy tratos_insert_creator on core.tratos
  for insert with check (auth.uid() = creator_id);

-- Ambos miembros pueden actualizar (para aceptar, marcar resolución, etc.)
create policy tratos_update_member on core.tratos
  for update using (auth.uid() in (creator_id, partner_id));
