-- F9 Rutina específica · plan de ejercicios prescrito por miembro + logging por ejercicio.
-- El catálogo de ejercicios vive en TS (lib/workout/catalog.ts) — el plan jsonb embebe
-- slug+nombre, igual que los platillos de F5. SANDBOX-FIRST: el plan sample se autogenera
-- determinista en page load; la IA (workout_ai, tier pro) es botón explícito con flag.

-- ── Plan de entrenamiento (1 por miembro; se regenera al cambiar rutina/objetivo) ──
create table if not exists core.workout_plans (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid not null unique references core.trato_miembros(id) on delete cascade,
  source text not null default 'sample' check (source in ('sample','ai')),
  plan jsonb not null,                                   -- WorkoutPlanContent (lib/workout/types.ts)
  prefs jsonb not null default '{}',                     -- { equipo: text[], lesiones?: text, preferencias?: text }
  generated_at timestamptz not null default now(),       -- para el rate-limit semanal de IA
  updated_at timestamptz not null default now()
);

drop trigger if exists workout_plans_updated_at on core.workout_plans;
create trigger workout_plans_updated_at
  before update on core.workout_plans
  for each row execute function core.set_updated_at();

-- ── Logging por ejercicio (series reales: reps × peso) — la progresión se lee de aquí ──
create table if not exists core.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references core.trato_miembros(id) on delete cascade,
  fecha date not null default current_date,
  exercise_slug text not null check (length(exercise_slug) between 1 and 60),
  series jsonb not null,                                 -- [{ reps: int, peso_kg: numeric|null }]
  created_at timestamptz not null default now()
);
create index if not exists exercise_logs_progresion_idx
  on core.exercise_logs(miembro_id, exercise_slug, fecha desc);
create index if not exists exercise_logs_fecha_idx
  on core.exercise_logs(miembro_id, fecha desc);

-- ── RLS: dueño del miembro (owns_miembro, mismo helper que user_rutinas) ──
alter table core.workout_plans enable row level security;
alter table core.exercise_logs enable row level security;

drop policy if exists workout_plans_own on core.workout_plans;
create policy workout_plans_own on core.workout_plans for all to authenticated
  using (core.owns_miembro(miembro_id, auth.uid()))
  with check (core.owns_miembro(miembro_id, auth.uid()));

drop policy if exists exercise_logs_own on core.exercise_logs;
create policy exercise_logs_own on core.exercise_logs for all to authenticated
  using (core.owns_miembro(miembro_id, auth.uid()))
  with check (core.owns_miembro(miembro_id, auth.uid()));

-- ── Grants explícitos (gotcha histórico: el "grant on all" previo fue point-in-time;
--    y las funciones de políticas RLS necesitan EXECUTE del rol que consulta) ──
grant usage on schema core to authenticated;
grant select, insert, update, delete on core.workout_plans to authenticated;
grant select, insert, delete on core.exercise_logs to authenticated;
grant select, insert, update, delete on core.workout_plans, core.exercise_logs to service_role;
grant execute on function core.owns_miembro(uuid, uuid) to authenticated;
