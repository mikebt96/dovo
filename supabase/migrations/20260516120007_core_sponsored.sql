-- core.brand_partners + sponsored_tratos + reward_codes: pilar 2 (P2 del MVP).

create type core.reward_tipo as enum ('cupon', 'producto', 'acceso', 'tarjeta_regalo');
create type core.sponsored_estado as enum ('activo', 'pausado', 'cerrado');

create table core.brand_partners (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto_email text not null,
  rfc text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table core.sponsored_tratos (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references core.brand_partners(id) on delete restrict,
  brand_logo_url text,
  goal_template text not null,
  frecuencia text not null,
  duracion_dias int not null check (duracion_dias between 1 and 365),
  recompensa_descripcion text not null,
  recompensa_tipo core.reward_tipo not null,
  setup_fee_mxn int not null check (setup_fee_mxn >= 0),
  per_completion_fee_mxn int not null check (per_completion_fee_mxn >= 0),
  estado core.sponsored_estado not null default 'activo',
  fecha_inicio date not null,
  fecha_fin date,
  cap_usuarios int check (cap_usuarios is null or cap_usuarios > 0),
  created_at timestamptz not null default now()
);

create table core.reward_codes (
  id uuid primary key default gen_random_uuid(),
  sponsored_trato_id uuid not null references core.sponsored_tratos(id) on delete cascade,
  codigo text not null unique,
  redeemed_by uuid references core.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index sponsored_brand_idx on core.sponsored_tratos(brand_id);
create index sponsored_estado_idx on core.sponsored_tratos(estado);
create index reward_codes_sponsored_idx on core.reward_codes(sponsored_trato_id);

-- Ahora añadir el FK que dejamos pendiente en tratos
alter table core.tratos
  add constraint tratos_sponsored_fk foreign key (sponsored_id)
  references core.sponsored_tratos(id) on delete set null;

comment on table core.brand_partners is 'Marcas que patrocinan tratos. Pilar 2 del MVP.';
comment on table core.sponsored_tratos is 'Templates de tratos patrocinados por marcas. Brand paga DOVO directamente — no se toca lana del usuario.';
comment on table core.reward_codes is 'Códigos de recompensa que se entregan a usuarios que cumplen un sponsored trato.';

alter table core.brand_partners enable row level security;
alter table core.sponsored_tratos enable row level security;
alter table core.reward_codes enable row level security;

-- Usuarios autenticados pueden leer sponsored_tratos activos (los descubren en la UI)
create policy sponsored_read_active on core.sponsored_tratos
  for select using (estado = 'activo' and auth.role() = 'authenticated');

-- Usuario solo lee sus propios reward_codes
create policy reward_codes_read_own on core.reward_codes
  for select using (auth.uid() = redeemed_by);
