-- F6 Análisis corporal · SOLO el RESULTADO numérico — la foto NUNCA se guarda (ni columna
-- existe). En modo live la imagen vive únicamente en la memoria del request de la action
-- y se descarta al responder; en modo sample ni siquiera se sube. Privacidad por diseño.
create table if not exists core.body_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  grasa_pct numeric(4,1) not null check (grasa_pct between 2 and 70),
  musculo_pct numeric(4,1) not null check (musculo_pct between 10 and 70),
  confianza text not null default 'media' check (confianza in ('baja','media','alta')),
  recomendaciones text[] not null default '{}',
  source text not null default 'sample' check (source in ('sample','ai')),
  created_at timestamptz not null default now()
);
create index if not exists body_scans_user_idx on core.body_scans(user_id, created_at desc);

alter table core.body_scans enable row level security;

drop policy if exists body_scans_own on core.body_scans;
create policy body_scans_own on core.body_scans for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema core to authenticated;
grant select, insert, delete on core.body_scans to authenticated;
grant select, insert, update, delete on core.body_scans to service_role;
