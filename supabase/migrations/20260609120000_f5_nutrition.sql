-- F5 Nutrición IA · perfil nutricional + meal plans semanales cacheados + logging diario.
-- SANDBOX-FIRST: sin ANTHROPIC_API_KEY el plan es un sample determinista (source='sample');
-- con key + NUTRITION_AI_LIVE=true la action regenera con Claude (source='ai').
-- Todo es dato del PROPIO usuario → RLS owner-only (auth.uid() = user_id), sin helpers.

-- ── Perfil nutricional (1:1 con user; complementa user_perfil_fisico que ya trae BMR/objetivo) ──
create table if not exists core.nutrition_profiles (
  user_id uuid primary key references core.users(id) on delete cascade,
  restricciones text[] not null default '{}',          -- vegetariano|vegano|sin_gluten|sin_lactosa|sin_cerdo|sin_mariscos
  presupuesto text not null default 'medio' check (presupuesto in ('bajo','medio','alto')),
  comidas_por_dia int not null default 4 check (comidas_por_dia between 3 and 5),
  preferencias text,                                    -- texto libre: antojos, alergias, lo que odia
  updated_at timestamptz not null default now()
);

drop trigger if exists nutrition_profiles_updated_at on core.nutrition_profiles;
create trigger nutrition_profiles_updated_at
  before update on core.nutrition_profiles
  for each row execute function core.set_updated_at();

-- ── Meal plans cacheados por semana (regeneración SEMANAL, no diaria — control de costo IA) ──
create table if not exists core.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  week_start date not null,                             -- lunes de la semana del plan
  source text not null default 'sample' check (source in ('sample','ai')),
  plan jsonb not null,                                  -- MealPlanContent (lib/nutrition/types.ts)
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create index if not exists meal_plans_user_idx on core.meal_plans(user_id);

-- ── Logging diario (local, sin IA: funciona siempre, con o sin key) ──
create table if not exists core.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null check (tipo in ('desayuno','comida','cena','snack')),
  descripcion text not null check (length(descripcion) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists food_logs_user_fecha_idx on core.food_logs(user_id, fecha);

-- ── RLS owner-only ──
alter table core.nutrition_profiles enable row level security;
alter table core.meal_plans enable row level security;
alter table core.food_logs enable row level security;

drop policy if exists nutrition_profiles_own on core.nutrition_profiles;
create policy nutrition_profiles_own on core.nutrition_profiles for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists meal_plans_own on core.meal_plans;
create policy meal_plans_own on core.meal_plans for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists food_logs_own on core.food_logs;
create policy food_logs_own on core.food_logs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Grants explícitos (el "grant on all tables" previo fue point-in-time, no cubre tablas nuevas) ──
grant usage on schema core to authenticated;
grant select, insert, update, delete on core.nutrition_profiles to authenticated;
grant select, insert, update, delete on core.meal_plans to authenticated;
grant select, insert, delete on core.food_logs to authenticated;
grant select, insert, update, delete on core.nutrition_profiles, core.meal_plans, core.food_logs to service_role;
