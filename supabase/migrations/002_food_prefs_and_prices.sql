-- =============================================================
-- Migration 002: Multi-store price scraping + AI meal replanning
--
-- Dietary preferences (postal_code, allergens, etc) ya están en
-- el schema consolidado (supabase/schema.sql) como columnas de profiles.
-- Esta migration cubre solo las tablas dependientes.
-- =============================================================

-- ---------- STORES ----------
create table if not exists stores (
  id text primary key,                       -- 'walmart' | 'soriana' | 'chedraui' | 'sumesa'
  display_name text not null,
  logo_url text,
  base_url text not null,
  scraper_kind text not null,                -- 'api' | 'html' | 'apify'
  active boolean default true,
  created_at timestamptz default now()
);

insert into stores (id, display_name, base_url, scraper_kind) values
  ('walmart',  'Walmart',  'https://www.walmart.com.mx',  'api'),
  ('soriana',  'Soriana',  'https://www.soriana.com',     'html'),
  ('chedraui', 'Chedraui', 'https://www.chedraui.com.mx', 'html'),
  ('sumesa',   'Sumesa',   'https://www.sumesa.com.mx',   'html')
on conflict (id) do nothing;

-- ---------- CANONICAL PRODUCTS ----------
create table if not exists products (
  id text primary key,                       -- 'huevo-18', 'tofu-firme-400g'
  canonical_name text not null,
  category text not null,
  unit text not null,                        -- 'piezas' | 'g' | 'ml' | 'L'
  unit_qty numeric not null,
  tags text[] default '{}',
  is_vegetarian boolean default true,
  is_vegan boolean default false,
  contains_dairy boolean default false,
  contains_eggs boolean default false,
  contains_gluten boolean default false,
  created_at timestamptz default now()
);

-- ---------- PRODUCT ALIASES PER STORE ----------
create table if not exists product_store_aliases (
  id bigserial primary key,
  product_id text not null references products(id) on delete cascade,
  store_id text not null references stores(id) on delete cascade,
  store_product_id text,                     -- SKU/id en la tienda
  query_term text not null,
  matched_name text,
  unique (product_id, store_id)
);

-- ---------- PRICE SNAPSHOTS ----------
-- Append-only para tracking de tendencias. NUNCA UPDATE.
create table if not exists price_snapshots (
  id bigserial primary key,
  product_id text not null references products(id) on delete cascade,
  store_id text not null references stores(id) on delete cascade,
  postal_code text,                          -- null = nacional
  price_mxn numeric not null,
  price_per_unit numeric,                    -- price_mxn / products.unit_qty
  in_stock boolean default true,
  promo_label text,                          -- "2x1" | "20% off" | null
  source_url text,
  scraped_at timestamptz default now()
);

create index if not exists idx_prices_product_recent
  on price_snapshots (product_id, scraped_at desc);
create index if not exists idx_prices_store_recent
  on price_snapshots (store_id, scraped_at desc);
create index if not exists idx_prices_postal
  on price_snapshots (postal_code);

-- ---------- VIEW: LATEST PRICE PER PRODUCT × STORE × CP ----------
create or replace view latest_prices as
select distinct on (product_id, store_id, postal_code)
  product_id,
  store_id,
  postal_code,
  price_mxn,
  price_per_unit,
  in_stock,
  promo_label,
  source_url,
  scraped_at
from price_snapshots
order by product_id, store_id, postal_code, scraped_at desc;

-- ---------- SCRAPE RUNS (observability) ----------
create table if not exists scrape_runs (
  id bigserial primary key,
  store_id text references stores(id) on delete set null,
  postal_code text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text,                               -- 'running' | 'ok' | 'partial' | 'failed'
  products_total int default 0,
  products_ok int default 0,
  products_failed int default 0,
  error text
);

create index if not exists idx_scrape_runs_status on scrape_runs (status, started_at desc);

-- ---------- AI MEAL REPLAN HISTORY ----------
-- Cuando user cambia prefs, guardamos el re-plan generado por Claude.
-- Append-only: nunca se actualiza, sirve para auditoría + undo.
create table if not exists meal_replans (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  triggered_by text not null,                -- 'prefs_changed' | 'manual'
  meals_changed jsonb not null,              -- MealReplanChanges (Zod)
  prefs_snapshot jsonb not null,             -- DietaryPrefsSnapshot (Zod)
  generated_at timestamptz default now()
);

create index if not exists idx_meal_replans_profile on meal_replans (profile_id, generated_at desc);
