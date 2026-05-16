-- =============================================================
-- Mike & Andy Plan · Supabase schema
-- Sin auth: identificación por slug en URL + selector profile
-- Todo el server-side usa service_role; client nunca habla directo a DB
-- =============================================================

-- ---------- PROFILES ----------
create table if not exists profiles (
  id text primary key,                   -- 'mike' | 'andy'
  display_name text not null,
  color text not null,                   -- accent hex
  phone_e164 text,                       -- WhatsApp
  whatsapp_opt_in boolean default false,
  baseline_kcal int,
  baseline_protein_g int,
  baseline_weight_kg numeric,
  height_cm int,
  age int,
  goal text,                             -- 'cut' | 'recomp' | 'lean_bulk'
  primary_sport text,                    -- 'gym' | 'running' | 'swimming' | 'ballet' | 'pilates' | 'cycling' | 'mixed'
  active_sports text[],                  -- ['gym','ballet','pilates'] — multi-deporte
  created_at timestamptz default now()
);

-- ---------- DAILY LOGS ----------
create table if not exists meals_log (
  id bigserial primary key,
  user_id text not null references profiles(id),
  date date not null,
  meal_id text not null,                 -- ej 'lun-mk-1' (matches seed)
  completed boolean default true,
  hunger_after int,                      -- 1=hambre, 5=lleno
  notes text,
  created_at timestamptz default now(),
  unique (user_id, date, meal_id)
);

create table if not exists exercises_log (
  id bigserial primary key,
  user_id text not null references profiles(id),
  date date not null,
  exercise_id text not null,             -- ej 'e-lun-2' (matches seed)
  sets jsonb not null,                   -- [{reps:10, weight_kg:22, rpe:8}, ...]
  notes text,
  created_at timestamptz default now(),
  unique (user_id, date, exercise_id)
);

create table if not exists weight_log (
  id bigserial primary key,
  user_id text not null references profiles(id),
  date date not null,
  weight_kg numeric not null,
  notes text,
  unique (user_id, date)
);

create table if not exists body_photos (
  id bigserial primary key,
  user_id text not null references profiles(id),
  taken_on date not null,
  storage_path text not null,            -- supabase storage path
  ai_analysis jsonb,                     -- claude vision output
  created_at timestamptz default now()
);

-- Unified non-gym activities (ballet, pilates, running, swimming, cycling, yoga…)
-- exercises_log queda solo para gym (sets/reps/peso). Esto es para todo lo demás.
create table if not exists activity_log (
  id bigserial primary key,
  user_id text not null references profiles(id),
  date date not null,
  activity_type text not null,           -- 'ballet' | 'pilates' | 'running' | 'swimming' | 'cycling' | 'yoga' | 'walk' | 'other'
  duration_min int not null,
  intensity int,                         -- RPE 1-10
  details jsonb,                         -- sport-specific: {distance_km, pace, choreography, laps, ...}
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_activity_user_date on activity_log (user_id, date);
create index if not exists idx_activity_type on activity_log (activity_type);

create table if not exists shopping_check (
  id bigserial primary key,
  user_id text not null references profiles(id),
  week_start date not null,              -- monday of week
  item_id text not null,
  checked_at timestamptz default now(),
  unique (user_id, week_start, item_id)
);

create table if not exists prep_check (
  id bigserial primary key,
  user_id text not null references profiles(id),
  week_start date not null,
  task_id text not null,
  checked_at timestamptz default now(),
  unique (user_id, week_start, task_id)
);

-- ---------- GAMIFICATION ----------
create table if not exists streaks (
  user_id text primary key references profiles(id),
  current int default 0,
  longest int default 0,
  last_active_date date,
  freezes_available int default 1,       -- streak freeze (1 por semana)
  updated_at timestamptz default now()
);

create table if not exists xp (
  user_id text primary key references profiles(id),
  total int default 0,
  level int default 1,
  updated_at timestamptz default now()
);

create table if not exists coins (
  user_id text primary key references profiles(id),
  balance int default 0,
  updated_at timestamptz default now()
);

create table if not exists xp_events (
  id bigserial primary key,
  user_id text not null references profiles(id),
  occurred_at timestamptz default now(),
  amount int not null,                   -- positivo = ganaste, negativo = castigo
  source text not null,                  -- 'meal' | 'exercise' | 'day_complete' | 'pair_bonus' | 'surprise' | 'penalty'
  source_ref text,                       -- ref al evento
  multiplier numeric default 1.0
);

-- ---------- REWARDS / PENALTIES ----------
create table if not exists rewards_catalog (
  id bigserial primary key,
  name text not null,
  description text,
  category text,                         -- 'ropa' | 'cine' | 'gym_gear' | 'suplementos' | 'experiencia' | 'custom'
  cost_coins int not null,
  requires_both boolean default false,   -- couple reward
  active boolean default true,
  created_by text references profiles(id),
  created_at timestamptz default now()
);

create table if not exists rewards_unlocked (
  id bigserial primary key,
  reward_id bigint references rewards_catalog(id),
  unlocked_by text references profiles(id),
  unlocked_for text,                     -- 'mike' | 'andy' | 'both'
  redeemed boolean default false,
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists penalties_catalog (
  id bigserial primary key,
  name text not null,
  description text,
  category text,                         -- 'domestico' | 'convivencia' | 'economico' | 'disciplina'
  severity int default 1,                -- 1=light, 3=heavy
  active boolean default true,
  created_by text references profiles(id),
  created_at timestamptz default now()
);

create table if not exists pair_debts (
  id bigserial primary key,
  debtor text references profiles(id),       -- el que rompió la racha
  creditor text references profiles(id),     -- el que cumplió
  penalty_id bigint references penalties_catalog(id),
  reason text,
  status text default 'pending',             -- 'pending' | 'paid' | 'forgiven'
  due_by date,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- AI COACH ----------
create table if not exists weekly_reviews (
  id bigserial primary key,
  user_id text references profiles(id),
  week_start date not null,
  summary_md text,                       -- claude output
  recommendations jsonb,                 -- {kcal_next_week, training_changes, alerts}
  body_analysis_md text,                 -- from photos
  generated_at timestamptz default now(),
  unique (user_id, week_start)
);

create table if not exists daily_alerts (
  id bigserial primary key,
  user_id text references profiles(id),
  date date not null,
  type text,                             -- 'progress_load', 'hunger_high', 'recovery_low', 'streak_warning'
  message text,
  acknowledged boolean default false,
  created_at timestamptz default now()
);

-- ---------- WHATSAPP ----------
create table if not exists wa_messages (
  id bigserial primary key,
  user_id text references profiles(id),
  direction text,                        -- 'out' | 'in'
  template_name text,
  body text,
  payload jsonb,
  status text,                           -- 'sent' | 'delivered' | 'read' | 'failed'
  sent_at timestamptz default now()
);

-- ---------- SURPRISES (random events) ----------
create table if not exists surprises (
  id bigserial primary key,
  user_id text references profiles(id),
  triggered_at timestamptz default now(),
  type text,                             -- 'xp_2x' | 'free_reward' | 'coin_bonus' | 'motivational'
  payload jsonb,
  claimed boolean default false
);

-- ---------- INDEXES ----------
create index if not exists idx_meals_user_date on meals_log (user_id, date);
create index if not exists idx_exercises_user_date on exercises_log (user_id, date);
create index if not exists idx_xp_events_user on xp_events (user_id, occurred_at desc);
create index if not exists idx_debts_status on pair_debts (status);

-- ---------- SEED PROFILES ----------
insert into profiles (id, display_name, color, baseline_kcal, baseline_protein_g, goal) values
  ('mike', 'Mike', '#6bf5ff', 2400, 155, 'recomp'),
  ('andy', 'Andy', '#ff6b9d', 1750, 115, 'recomp')
on conflict (id) do nothing;

insert into streaks (user_id) values ('mike'), ('andy')
on conflict (user_id) do nothing;

insert into xp (user_id) values ('mike'), ('andy')
on conflict (user_id) do nothing;

insert into coins (user_id, balance) values ('mike', 0), ('andy', 0)
on conflict (user_id) do nothing;
