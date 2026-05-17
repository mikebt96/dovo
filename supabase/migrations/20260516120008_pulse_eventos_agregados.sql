-- pulse.eventos_agregados: NUNCA contiene IDs ni contenido textual.
-- Solo buckets y categorías. k-anonymity ≥ 100 se enforce en queries (no aquí).

create table pulse.eventos_agregados (
  id bigserial primary key,
  ingested_at timestamptz not null default now(),
  categoria text not null check (categoria in (
    'fitness', 'ahorro', 'habitos', 'aprendizaje', 'relacion', 'otro'
  )),
  duracion_dias_bucket text not null check (duracion_dias_bucket in (
    '<7d', '7-14d', '14-30d', '30-60d', '60-90d', '>90d'
  )),
  tasa_cumplimiento_bucket text not null check (tasa_cumplimiento_bucket in (
    '0-0.2', '0.2-0.5', '0.5-0.8', '0.8-1.0'
  )),
  cohorte_edad text not null check (cohorte_edad in (
    '<25', '25-35', '35-45', '45-55', '>55', 'unknown'
  )),
  cohorte_ciudad text not null check (cohorte_ciudad in (
    'CDMX', 'GDL', 'MTY', 'otras', 'unknown'
  )),
  es_patrocinado boolean not null,
  dow_creacion int not null check (dow_creacion between 0 and 6)
);

create index eventos_categoria_idx on pulse.eventos_agregados(categoria);
create index eventos_ingested_at_idx on pulse.eventos_agregados(ingested_at);

comment on table pulse.eventos_agregados is 'Eventos agregados anónimos para inteligencia conductual. NUNCA tiene user_id, trato_id, ni contenido textual de tratos. k-anonymity ≥ 100 enforced en queries downstream.';

-- RLS: ningún acceso desde clientes (anon, authenticated). Solo service_role.
alter table pulse.eventos_agregados enable row level security;
-- No se crean policies de SELECT/INSERT para anon/authenticated.
-- Solo service_role (que bypassa RLS) puede tocar esta tabla.
