-- ════════════════════════════════════════════════════════════════════
-- FIX P0 · El primer signup público real reventó el onboarding.
--
-- core.users tenía RLS con políticas de SELECT (own + comember) y UPDATE (own)
-- pero NINGUNA de INSERT: el upsert del callback de auth (app/auth/callback)
-- fallaba con RLS y solo se logueaba (console.error) — la fila del usuario
-- jamás se creaba y TODO lo downstream tronaba por FK
-- (user_perfil_fisico_user_id_fkey en el onboarding, primer síntoma visible).
-- Nadie lo vio antes porque todos los usuarios existentes nacieron del seed
-- (service_role salta RLS). user_character/user_streak/user_perfil_fisico ya
-- tenían su *_own_insert — solo users quedó sin puerta de entrada.
-- ════════════════════════════════════════════════════════════════════

-- cada usuario puede crear SOLO su propia fila (mismo patrón *_own_insert)
drop policy if exists users_insert_self on core.users;
create policy users_insert_self on core.users
  for insert with check (auth.uid() = id);

-- ── Backfill: cuentas de auth que quedaron huérfanas por el bug ──
-- (id en auth.users sin fila en core.users). Nombre desde el metadata de
-- Google/magic-link, mismo fallback que el callback.
insert into core.users (id, email, nombre, access_channel)
select
  au.id,
  au.email,
  coalesce(
    au.raw_user_meta_data->>'nombre',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'sin nombre'
  ),
  'fcfs'
from auth.users au
left join core.users cu on cu.id = au.id
where cu.id is null and au.email is not null
on conflict (id) do nothing;

-- y sus filas iniciales del character system (el callback también las upsertea,
-- pero estas cuentas ya pasaron por el callback y no volverán hasta re-login)
insert into core.user_character (user_id)
select id from core.users
on conflict (user_id) do nothing;

insert into core.user_streak (user_id)
select id from core.users
on conflict (user_id) do nothing;
