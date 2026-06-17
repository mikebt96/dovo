-- ════════════════════════════════════════════════════════════════════
-- F28 · STRAVA como fuente de actividad EN WEB (decisión del founder: "1 y 2"
-- — Strava ahora, app nativa después). HealthKit/Health Connect son
-- native-only; Strava da OAuth web y entrega carreras/ciclismo con distancia,
-- duración, FC y resumen de GPS — suficiente para validar entrenos hoy.
--
-- Mock-first / keys-later (patrón NUTRITION_AI_LIVE): sin STRAVA_CLIENT_ID la
-- UI muestra "próximamente"; con las llaves de Miguel, el botón "conectar"
-- hace el OAuth real. Los TOKENS son secretos → tabla service-role-only,
-- jamás legibles por el cliente. Los datos importados son SALUD: van a
-- core.actividad_metricas (owner-only) y JAMÁS a Pulse (aviso §6/§8).
-- ════════════════════════════════════════════════════════════════════

-- Strava es ahora un proveedor conectable (no solo waitlist)
alter table core.fuentes_salud drop constraint if exists fuentes_salud_proveedor_check;
alter table core.fuentes_salud
  add constraint fuentes_salud_proveedor_check
  check (proveedor in ('apple_health', 'health_connect', 'manual', 'strava'));

-- Tokens OAuth de Strava: SECRETOS. RLS sin policies para authenticated =
-- inaccesible al cliente; solo el server (service_role) los lee para refrescar
-- y sincronizar.
create table if not exists core.strava_tokens (
  user_id uuid primary key references core.users(id) on delete cascade,
  athlete_id bigint,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists strava_tokens_updated_at on core.strava_tokens;
create trigger strava_tokens_updated_at
  before update on core.strava_tokens
  for each row execute function core.set_updated_at();

alter table core.strava_tokens enable row level security;
-- deliberado: SIN policies (los tokens son secretos del server). service_role
-- bypassa RLS; authenticated/anon no tocan esta tabla.
revoke all on core.strava_tokens from authenticated, anon;
grant all on core.strava_tokens to service_role;

-- origen del registro de actividad: de dónde vino una fila de metricas. Para
-- evitar duplicar un check-in que ya entró por Strava (idempotencia del sync).
alter table core.actividad_metricas
  add column if not exists origen_externo text;
create unique index if not exists actividad_metricas_origen_externo_idx
  on core.actividad_metricas(origen_externo)
  where origen_externo is not null;
