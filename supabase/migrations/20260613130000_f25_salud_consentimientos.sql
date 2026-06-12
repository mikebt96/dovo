-- ════════════════════════════════════════════════════════════════════
-- F25 · CONSENTIMIENTOS VERSIONADOS + FUENTES DE SALUD (mandato del founder
-- 2026-06-12): la app debe poder conectar las apps de salud del teléfono
-- (Apple Health / Health Connect) y usar ubicación para validar entrenos.
--
-- Diseño:
-- · core.consentimientos — bitácora APPEND-ONLY (jamás update/delete): cada
--   otorgamiento o revocación es una fila nueva con la versión del aviso
--   vigente. Es la evidencia de consentimiento expreso que exige la ley
--   para datos sensibles (salud) y la base de auditoría ante la autoridad.
-- · core.fuentes_salud — estado de conexión por proveedor. En web móvil los
--   SDKs nativos no existen: 'interesado' = waitlist para la app nativa.
-- · core.actividad_metricas — SOLO RESUMEN por check-in (distancia, duración,
--   pasos, FC promedio). El trail GPS crudo JAMÁS se persiste (filosofía del
--   candado: ancla + booleano + distancia, nunca rutas).
--
-- Datos de salud = SENSIBLES: RLS owner-only (ni el compa los ve) y por
-- política de plataformas (HealthKit/Health Connect) JAMÁS entran a Pulse
-- ni a inteligencia de premios ni se venden/comparten.
-- ════════════════════════════════════════════════════════════════════

-- ── Consentimientos (append-only, versionado) ──
create table if not exists core.consentimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  tipo text not null check (tipo in ('salud', 'ubicacion', 'aviso_privacidad')),
  otorgado boolean not null,
  version_aviso text not null,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists consentimientos_user_idx
  on core.consentimientos(user_id, tipo, created_at desc);

alter table core.consentimientos enable row level security;
drop policy if exists consentimientos_self_select on core.consentimientos;
create policy consentimientos_self_select on core.consentimientos
  for select using (auth.uid() = user_id);
drop policy if exists consentimientos_self_insert on core.consentimientos;
create policy consentimientos_self_insert on core.consentimientos
  for insert with check (auth.uid() = user_id);

revoke all on core.consentimientos from authenticated;
grant select, insert on core.consentimientos to authenticated;
grant all on core.consentimientos to service_role;

-- ── Fuentes de salud por usuario ──
create table if not exists core.fuentes_salud (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  proveedor text not null check (proveedor in ('apple_health', 'health_connect', 'manual')),
  estado text not null default 'interesado'
    check (estado in ('interesado', 'conectado', 'desconectado')),
  scopes text[] not null default '{}',
  conectado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, proveedor)
);

drop trigger if exists fuentes_salud_updated_at on core.fuentes_salud;
create trigger fuentes_salud_updated_at
  before update on core.fuentes_salud
  for each row execute function core.set_updated_at();

alter table core.fuentes_salud enable row level security;
drop policy if exists fuentes_salud_self_select on core.fuentes_salud;
create policy fuentes_salud_self_select on core.fuentes_salud
  for select using (auth.uid() = user_id);
drop policy if exists fuentes_salud_self_insert on core.fuentes_salud;
create policy fuentes_salud_self_insert on core.fuentes_salud
  for insert with check (auth.uid() = user_id);
drop policy if exists fuentes_salud_self_update on core.fuentes_salud;
create policy fuentes_salud_self_update on core.fuentes_salud
  for update using (auth.uid() = user_id);

revoke all on core.fuentes_salud from authenticated;
grant select, insert, update on core.fuentes_salud to authenticated;
grant all on core.fuentes_salud to service_role;

-- ── Métricas RESUMEN de actividad (1:1 con check-in; jamás trail GPS) ──
create table if not exists core.actividad_metricas (
  checkin_id uuid primary key references core.checkins(id) on delete cascade,
  fuente text not null check (fuente in ('web_gps', 'apple_health', 'health_connect', 'manual')),
  distancia_m int check (distancia_m between 0 and 300000),
  duracion_s int check (duracion_s between 0 and 86400),
  pasos int check (pasos between 0 and 200000),
  fc_promedio int check (fc_promedio between 30 and 250),
  verificado_ruta boolean not null default false,
  created_at timestamptz not null default now()
);

alter table core.actividad_metricas enable row level security;
-- Owner-only: la FC y métricas de salud NO son visibles ni para el compa.
drop policy if exists actividad_metricas_owner_select on core.actividad_metricas;
create policy actividad_metricas_owner_select on core.actividad_metricas
  for select using (
    exists (
      select 1
      from core.checkins c
      join core.trato_miembros m on m.id = c.miembro_id
      where c.id = checkin_id and m.user_id = auth.uid()
    )
  );
drop policy if exists actividad_metricas_owner_insert on core.actividad_metricas;
create policy actividad_metricas_owner_insert on core.actividad_metricas
  for insert with check (
    exists (
      select 1
      from core.checkins c
      join core.trato_miembros m on m.id = c.miembro_id
      where c.id = checkin_id and m.user_id = auth.uid()
    )
  );

revoke all on core.actividad_metricas from authenticated;
grant select, insert on core.actividad_metricas to authenticated;
grant all on core.actividad_metricas to service_role;
