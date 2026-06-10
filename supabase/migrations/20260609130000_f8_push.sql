-- F8 Push notifications (PWA) · suscripciones Web Push por device + preferencias por user.
-- VAPID keys self-served (env de Vercel, sin cuenta de terceros). Sin keys el envío es
-- no-op (fail-soft); la suscripción del browser funciona igual y queda lista.
-- Datos del PROPIO usuario → RLS owner-only.

create table if not exists core.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on core.push_subscriptions(user_id);

create table if not exists core.notification_prefs (
  user_id uuid primary key references core.users(id) on delete cascade,
  racha_riesgo boolean not null default true,
  reto boolean not null default true,
  recompensa boolean not null default true,
  checkin_companero boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_prefs_updated_at on core.notification_prefs;
create trigger notification_prefs_updated_at
  before update on core.notification_prefs
  for each row execute function core.set_updated_at();

alter table core.push_subscriptions enable row level security;
alter table core.notification_prefs enable row level security;

drop policy if exists push_subscriptions_own on core.push_subscriptions;
create policy push_subscriptions_own on core.push_subscriptions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notification_prefs_own on core.notification_prefs;
create policy notification_prefs_own on core.notification_prefs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema core to authenticated;
grant select, insert, update, delete on core.push_subscriptions to authenticated;
grant select, insert, update on core.notification_prefs to authenticated;
-- service_role: el helper de envío lee subs/prefs de OTROS users (notificar al compañero).
grant select, insert, update, delete on core.push_subscriptions, core.notification_prefs to service_role;
