-- F7 Pagos · infraestructura de gating por DÚO. La suscripción es del trato (no del user):
-- una sub por dúo, cualquiera paga, aplica a ambos. SIN row = tier free.
-- El estado lo escribe SOLO el webhook de Stripe (service_role); el cliente solo LEE.
-- Sandbox-first: sin Stripe keys nada de esto se ejerce (createCheckout devuelve coming_soon),
-- pero el modelo de datos queda listo para encenderse al pegar las keys (flag BILLING_ENABLED).

-- ── Tier de suscripción del dúo ──
do $$ begin
  create type core.sub_tier as enum ('free', 'pro', 'premium');
exception when duplicate_object then null; end $$;

-- ── Suscripción 1:1 por dúo (PK = trato_id ⇒ fuerza "un dúo, una sub") ──
create table if not exists core.subscriptions (
  trato_id uuid primary key references core.tratos(id) on delete cascade,
  tier core.sub_tier not null default 'free',
  status text not null default 'incomplete',          -- espejo de Stripe: trialing|active|past_due|canceled|incomplete|...
  interval text,                                       -- month | year (para display)
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_customer_idx on core.subscriptions(stripe_customer_id);

drop trigger if exists subscriptions_updated_at on core.subscriptions;
create trigger subscriptions_updated_at
  before update on core.subscriptions
  for each row execute function core.set_updated_at();

-- ── Idempotencia de webhooks: cada event.id se procesa UNA vez (Stripe reintenta en 500) ──
create table if not exists core.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- ── RLS ──
alter table core.subscriptions enable row level security;
alter table core.stripe_events enable row level security;

-- Los miembros del dúo LEEN su suscripción (badge, estado). Nadie escribe vía cliente:
-- el webhook usa service_role (bypass RLS). stripe_events es 100% service_role (sin policy ni grant).
drop policy if exists subscriptions_read_member on core.subscriptions;
create policy subscriptions_read_member on core.subscriptions for select to authenticated
  using (core.is_trato_member(trato_id, auth.uid()));

-- ── Grants ──
-- (grants explícitos: el "grant on all tables" de migraciones previas fue point-in-time y NO
--  cubre tablas creadas después.)
grant usage on schema core to authenticated;
grant select on core.subscriptions to authenticated;                 -- solo SELECT a authenticated
grant select, insert, update, delete on core.subscriptions to service_role;
grant select, insert, update, delete on core.stripe_events to service_role;
-- la policy subscriptions_read_member llama is_trato_member → reafirmo grant idempotente
-- (misma lección que is_reto_party: función usada DENTRO de una policy necesita EXECUTE al rol que consulta).
grant execute on function core.is_trato_member(uuid, uuid) to authenticated;
