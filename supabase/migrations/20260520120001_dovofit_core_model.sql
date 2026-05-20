-- F1 · Nuevo modelo core de dovofit: perfil físico, catálogo de actividades,
-- grupos N-miembros, rutinas, check-ins con métricas, character system, streak.
-- Reusa core.set_updated_at() (creada en core.users, no borrada).

-- ════════════════════════════════════════════════════════════════════
-- ENUMS
-- ════════════════════════════════════════════════════════════════════
create type core.nivel_actividad as enum ('sedentario', 'ligero', 'moderado', 'activo', 'muy_activo');
create type core.objetivo_fisico as enum ('perder_grasa', 'ganar_musculo', 'mantener', 'mejorar_resistencia');
create type core.experiencia_nivel as enum ('principiante', 'intermedio', 'avanzado');
create type core.tipo_grupo as enum ('pareja', 'pequeno', 'grande');
create type core.trato_estado as enum ('activo', 'archivado');

-- ════════════════════════════════════════════════════════════════════
-- PERFIL FÍSICO (1:1 con user, base para BMR)
-- ════════════════════════════════════════════════════════════════════
create table core.user_perfil_fisico (
  user_id uuid primary key references core.users(id) on delete cascade,
  peso_kg numeric(5,2) not null check (peso_kg between 20 and 400),
  altura_cm numeric(5,1) not null check (altura_cm between 80 and 260),
  edad int not null check (edad between 13 and 120),
  genero text not null check (genero in ('masculino', 'femenino', 'otro')),
  nivel_actividad core.nivel_actividad not null,
  objetivo core.objetivo_fisico not null,
  experiencia core.experiencia_nivel,
  lesiones text[],
  bmr_calculado numeric(7,2),
  updated_at timestamptz not null default now()
);

create trigger perfil_fisico_updated_at
  before update on core.user_perfil_fisico
  for each row execute function core.set_updated_at();

alter table core.user_perfil_fisico enable row level security;
create policy perfil_fisico_own_select on core.user_perfil_fisico
  for select using (auth.uid() = user_id);
create policy perfil_fisico_own_insert on core.user_perfil_fisico
  for insert with check (auth.uid() = user_id);
create policy perfil_fisico_own_update on core.user_perfil_fisico
  for update using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- CATÁLOGO DE ACTIVIDADES (tabla seeded, lectura pública para authenticated)
-- ════════════════════════════════════════════════════════════════════
create table core.actividades (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  modality text not null,
  kcal_por_min numeric(5,2) not null,
  metricas_requeridas text[] not null,
  stats_primary text[] not null,
  stats_secondary text[] not null default '{}',
  activa boolean not null default true
);

comment on table core.actividades is 'Catálogo cerrado de actividades físicas. kcal_por_min es aproximado base, refinado por intensidad/peso del user en el cálculo de F2.';

alter table core.actividades enable row level security;
create policy actividades_read_all on core.actividades
  for select using (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════
-- GRUPOS (tratos rework: N miembros, sin goal/duracion)
-- ════════════════════════════════════════════════════════════════════
create table core.tratos (
  id uuid primary key default gen_random_uuid(),
  nombre_grupo text not null check (length(nombre_grupo) between 1 and 80),
  tipo_grupo core.tipo_grupo not null default 'pareja',
  estado core.trato_estado not null default 'activo',
  created_by uuid not null references core.users(id) on delete restrict,
  invite_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tratos_invite_token_idx on core.tratos(invite_token);

create trigger tratos_updated_at
  before update on core.tratos
  for each row execute function core.set_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- MIEMBROS DEL GRUPO
-- ════════════════════════════════════════════════════════════════════
create table core.trato_miembros (
  id uuid primary key default gen_random_uuid(),
  trato_id uuid not null references core.tratos(id) on delete cascade,
  user_id uuid not null references core.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'creator')),
  joined_at timestamptz not null default now(),
  unique (trato_id, user_id)
);

create index trato_miembros_trato_idx on core.trato_miembros(trato_id);
create index trato_miembros_user_idx on core.trato_miembros(user_id);

-- Helper SECURITY DEFINER para evitar recursión en RLS policies de grupos.
create or replace function core.is_trato_member(p_trato_id uuid, p_user_id uuid)
returns boolean as $$
  select exists(
    select 1 from core.trato_miembros
    where trato_id = p_trato_id and user_id = p_user_id
  );
$$ language sql security definer stable set search_path = core;

-- ════════════════════════════════════════════════════════════════════
-- RLS de tratos + trato_miembros (usa is_trato_member para no recursar)
-- ════════════════════════════════════════════════════════════════════
alter table core.tratos enable row level security;
create policy tratos_read_member on core.tratos
  for select using (core.is_trato_member(id, auth.uid()));
create policy tratos_insert_creator on core.tratos
  for insert with check (auth.uid() = created_by);
-- Democrático: cualquier miembro puede actualizar el grupo
create policy tratos_update_member on core.tratos
  for update using (core.is_trato_member(id, auth.uid()));

alter table core.trato_miembros enable row level security;
create policy miembros_read_comembers on core.trato_miembros
  for select using (core.is_trato_member(trato_id, auth.uid()));
-- Un user solo puede insertarse a sí mismo (unirse)
create policy miembros_insert_self on core.trato_miembros
  for insert with check (auth.uid() = user_id);
create policy miembros_delete_self on core.trato_miembros
  for delete using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- RUTINAS (por miembro: default + variantes viaje/recovery)
-- ════════════════════════════════════════════════════════════════════
create table core.user_rutinas (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references core.trato_miembros(id) on delete cascade,
  nombre text not null,
  is_default boolean not null default false,
  is_travel boolean not null default false,
  -- actividades: jsonb array de {actividad_id, frecuencia_semanal, duracion_min}
  actividades jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index user_rutinas_miembro_idx on core.user_rutinas(miembro_id);

-- Helper: el user es dueño del miembro_id
create or replace function core.owns_miembro(p_miembro_id uuid, p_user_id uuid)
returns boolean as $$
  select exists(
    select 1 from core.trato_miembros
    where id = p_miembro_id and user_id = p_user_id
  );
$$ language sql security definer stable set search_path = core;

alter table core.user_rutinas enable row level security;
create policy rutinas_owner_all on core.user_rutinas
  for all using (core.owns_miembro(miembro_id, auth.uid()))
  with check (core.owns_miembro(miembro_id, auth.uid()));

-- ════════════════════════════════════════════════════════════════════
-- CHECK-INS (rework: métricas estructuradas jsonb, sin binary cumplido)
-- ════════════════════════════════════════════════════════════════════
create table core.checkins (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references core.trato_miembros(id) on delete cascade,
  actividad_id uuid not null references core.actividades(id) on delete restrict,
  fecha date not null,
  -- metricas: jsonb con las metricas_requeridas de la actividad (peso_kg, reps, distancia_km, etc.)
  metricas jsonb not null default '{}',
  -- kcal_calculadas y puntos se llenan en F2 (cálculo de scoring)
  kcal_calculadas numeric(7,2),
  puntos numeric(7,2),
  created_at timestamptz not null default now()
);

create index checkins_miembro_idx on core.checkins(miembro_id);
create index checkins_fecha_idx on core.checkins(fecha);

-- Helper para SELECT de checkins: el miembro pertenece a un trato del que auth.uid() es miembro
create or replace function core.checkin_visible(p_miembro_id uuid, p_user_id uuid)
returns boolean as $$
  select exists(
    select 1
    from core.trato_miembros tm_owner
    join core.trato_miembros tm_viewer on tm_viewer.trato_id = tm_owner.trato_id
    where tm_owner.id = p_miembro_id and tm_viewer.user_id = p_user_id
  );
$$ language sql security definer stable set search_path = core;

alter table core.checkins enable row level security;
-- Co-miembros del trato pueden leer los check-ins (para comparación de grupo)
create policy checkins_read_comembers on core.checkins
  for select using (core.checkin_visible(miembro_id, auth.uid()));
-- Solo el dueño del miembro inserta/actualiza sus check-ins
create policy checkins_insert_owner on core.checkins
  for insert with check (core.owns_miembro(miembro_id, auth.uid()));
create policy checkins_update_owner on core.checkins
  for update using (core.owns_miembro(miembro_id, auth.uid()));

-- ════════════════════════════════════════════════════════════════════
-- CHARACTER SYSTEM (6 stats + nivel/xp/prestige)
-- ════════════════════════════════════════════════════════════════════
create table core.user_character (
  user_id uuid primary key references core.users(id) on delete cascade,
  fue numeric(8,2) not null default 0,
  res numeric(8,2) not null default 0,
  flex numeric(8,2) not null default 0,
  vel numeric(8,2) not null default 0,
  equ numeric(8,2) not null default 0,
  vit numeric(8,2) not null default 0,
  nivel int not null default 1,
  xp numeric(10,2) not null default 0,
  prestige int not null default 0,
  class_name text not null default 'Novato',
  updated_at timestamptz not null default now()
);

create trigger character_updated_at
  before update on core.user_character
  for each row execute function core.set_updated_at();

alter table core.user_character enable row level security;
create policy character_own_select on core.user_character
  for select using (auth.uid() = user_id);
create policy character_own_insert on core.user_character
  for insert with check (auth.uid() = user_id);
create policy character_own_update on core.user_character
  for update using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- STREAK
-- ════════════════════════════════════════════════════════════════════
create table core.user_streak (
  user_id uuid primary key references core.users(id) on delete cascade,
  current_streak_weeks int not null default 0,
  max_streak int not null default 0,
  last_cumplido_week date,
  updated_at timestamptz not null default now()
);

create trigger streak_updated_at
  before update on core.user_streak
  for each row execute function core.set_updated_at();

alter table core.user_streak enable row level security;
create policy streak_own_select on core.user_streak
  for select using (auth.uid() = user_id);
create policy streak_own_insert on core.user_streak
  for insert with check (auth.uid() = user_id);
create policy streak_own_update on core.user_streak
  for update using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- GRANTS (explícitos para las tablas nuevas; complementa default privileges)
-- ════════════════════════════════════════════════════════════════════
grant select, insert, update on all tables in schema core to authenticated;
grant select, insert, update, delete on all tables in schema core to service_role;
grant usage, select on all sequences in schema core to authenticated, service_role;
