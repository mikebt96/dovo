-- =============================================================
-- Mike & Andy Plan · Supabase schema
--
-- Identidad: UUID interno + slug público (mike|andy).
-- Slug es el único identificador que ve el cliente; el server traduce
-- slug → uuid antes de cualquier query. Esto evita el ALTER masivo
-- cuando pivotemos a multi-household (ver SAAS_MIGRATION_PATH.md).
--
-- Sin auth de Supabase. Cliente nunca habla directo a DB:
-- server-only (RSC + Server Actions) usa SUPABASE_SERVICE_ROLE_KEY.
-- =============================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------- PROFILES ----------
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                 -- 'mike' | 'andy' — público
  display_name text not null,
  color text not null,                       -- accent hex
  phone_e164 text,                           -- WhatsApp
  whatsapp_opt_in boolean default false,
  baseline_kcal int,
  baseline_protein_g int,
  baseline_weight_kg numeric,
  height_cm int,
  age int,
  goal text,                                 -- 'cut' | 'recomp' | 'lean_bulk'
  primary_sport text,                        -- 'gym' | 'running' | …
  active_sports text[],                      -- ['gym','ballet','pilates']

  -- Dietary preferences (granular para AI replanning)
  postal_code text,
  dietary_tags text[] default '{}',          -- ['vegetarian','no-gluten','no-dairy']
  allergens text[] default '{}',             -- ['peanuts','shellfish','eggs']
  disliked_ingredients text[] default '{}',  -- ['cilantro','aceitunas']
  liked_ingredients text[] default '{}',     -- ['tofu','plátano','aguacate']
  disliked_textures text[] default '{}',     -- ['gomoso','crujiente']
  max_meal_kcal int,
  notes_for_ai text,                         -- free-text para Claude

  created_at timestamptz default now()
);

create index if not exists idx_profiles_slug on profiles (slug);

-- ---------- DAILY LOGS ----------
create table if not exists meals_log (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  meal_id text not null,                     -- ej 'lun-mk-1' (matches lib/data/meals.ts)
  completed boolean default true,
  hunger_after int,                          -- 1=hambre, 5=lleno
  notes text,
  created_at timestamptz default now(),
  unique (profile_id, date, meal_id)
);

create index if not exists idx_meals_profile_date on meals_log (profile_id, date desc);
create index if not exists idx_meals_date on meals_log (date desc);

create table if not exists exercises_log (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  exercise_id text not null,                 -- ej 'e-lun-2'
  sets jsonb not null,                       -- ExerciseSet[] validado con Zod
  notes text,
  created_at timestamptz default now(),
  unique (profile_id, date, exercise_id)
);

create index if not exists idx_exercises_profile_date on exercises_log (profile_id, date desc);

create table if not exists weight_log (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  weight_kg numeric not null,
  notes text,
  unique (profile_id, date)
);

create index if not exists idx_weight_profile_date on weight_log (profile_id, date desc);

create table if not exists body_photos (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  taken_on date not null,
  storage_path text not null,                -- supabase storage path
  ai_analysis jsonb,                         -- BodyAnalysisV1 (Zod)
  created_at timestamptz default now()
);

create index if not exists idx_body_photos_profile_date on body_photos (profile_id, taken_on desc);

-- Unified non-gym activities (ballet, pilates, running, swimming, cycling, yoga…)
create table if not exists activity_log (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  activity_type text not null,               -- 'ballet' | 'pilates' | 'running' | …
  duration_min int not null,
  intensity int,                             -- RPE 1-10
  details jsonb,                             -- ActivityDetails (Zod)
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_activity_profile_date on activity_log (profile_id, date desc);
create index if not exists idx_activity_type on activity_log (activity_type);

create table if not exists shopping_check (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,                  -- monday of week
  item_id text not null,
  checked_at timestamptz default now(),
  unique (profile_id, week_start, item_id)
);

create table if not exists prep_check (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  task_id text not null,
  checked_at timestamptz default now(),
  unique (profile_id, week_start, task_id)
);

-- ---------- GAMIFICATION ----------
create table if not exists streaks (
  profile_id uuid primary key references profiles(id) on delete cascade,
  current int default 0,
  longest int default 0,
  last_active_date date,
  freezes_available int default 1,           -- 1 por semana
  updated_at timestamptz default now()
);

create table if not exists xp (
  profile_id uuid primary key references profiles(id) on delete cascade,
  total int default 0,
  level int default 1,
  updated_at timestamptz default now()
);

create table if not exists coins (
  profile_id uuid primary key references profiles(id) on delete cascade,
  balance int default 0,
  updated_at timestamptz default now()
);

create table if not exists xp_events (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  occurred_at timestamptz default now(),
  amount int not null,                       -- + ganaste, − castigo
  source text not null,                      -- 'meal' | 'exercise' | 'day_complete' | 'pair_bonus' | 'surprise' | 'penalty'
  source_ref text,
  multiplier numeric default 1.0,
  payload jsonb                              -- XpEventPayload (Zod, opcional)
);

create index if not exists idx_xp_events_profile on xp_events (profile_id, occurred_at desc);

-- ---------- REWARDS / PENALTIES ----------
create table if not exists rewards_catalog (
  id bigserial primary key,
  name text not null,
  description text,
  category text,                             -- 'ropa' | 'cine' | 'gym_gear' | 'suplementos' | 'experiencia' | 'custom'
  cost_coins int not null,
  requires_both boolean default false,       -- couple reward
  active boolean default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists rewards_unlocked (
  id bigserial primary key,
  reward_id bigint references rewards_catalog(id) on delete cascade,
  unlocked_by uuid references profiles(id) on delete set null,
  unlocked_for_slug text,                    -- 'mike' | 'andy' | 'both' (semántico, no FK)
  redeemed boolean default false,
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists penalties_catalog (
  id bigserial primary key,
  name text not null,
  description text,
  category text,                             -- 'domestico' | 'convivencia' | 'economico' | 'disciplina'
  severity int default 1,                    -- 1=light, 3=heavy
  active boolean default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists pair_debts (
  id bigserial primary key,
  debtor uuid not null references profiles(id) on delete cascade,
  creditor uuid not null references profiles(id) on delete cascade,
  penalty_id bigint references penalties_catalog(id) on delete set null,
  reason text,
  status text default 'pending',             -- 'pending' | 'paid' | 'forgiven'
  due_by date,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  check (debtor <> creditor)
);

create index if not exists idx_debts_status on pair_debts (status);
create index if not exists idx_debts_debtor on pair_debts (debtor);

-- ---------- AI COACH ----------
create table if not exists weekly_reviews (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  summary_md text,                           -- claude output
  recommendations jsonb,                     -- WeeklyRecommendations (Zod)
  body_analysis_md text,                     -- from photos
  generated_at timestamptz default now(),
  unique (profile_id, week_start)
);

create table if not exists daily_alerts (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  type text,                                 -- 'progress_load', 'hunger_high', 'recovery_low', 'streak_warning'
  message text,
  acknowledged boolean default false,
  created_at timestamptz default now()
);

-- ---------- WHATSAPP ----------
create table if not exists wa_messages (
  id bigserial primary key,
  profile_id uuid references profiles(id) on delete set null,
  direction text,                            -- 'out' | 'in'
  template_name text,
  body text,
  payload jsonb,
  status text,                               -- 'sent' | 'delivered' | 'read' | 'failed'
  sent_at timestamptz default now()
);

-- ---------- SURPRISES (random events) ----------
create table if not exists surprises (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  triggered_at timestamptz default now(),
  type text,                                 -- 'xp_2x' | 'free_reward' | 'coin_bonus' | 'motivational'
  payload jsonb,
  claimed boolean default false
);

-- ---------- SEED PROFILES ----------
-- IDs UUIDs deterministas para v1 (mismos en cada deploy).
-- Cambian al pivot SaaS.
insert into profiles (
  id, slug, display_name, color,
  baseline_kcal, baseline_protein_g, goal,
  active_sports
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'mike', 'Mike', '#6bf5ff',
    2400, 155, 'recomp',
    array['gym','caminadora']
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'andy', 'Andy', '#ff6b9d',
    1750, 115, 'recomp',
    array['gym','ballet','pilates']
  )
on conflict (slug) do nothing;

insert into streaks (profile_id)
  select id from profiles where slug in ('mike','andy')
on conflict (profile_id) do nothing;

insert into xp (profile_id)
  select id from profiles where slug in ('mike','andy')
on conflict (profile_id) do nothing;

insert into coins (profile_id)
  select id from profiles where slug in ('mike','andy')
on conflict (profile_id) do nothing;
