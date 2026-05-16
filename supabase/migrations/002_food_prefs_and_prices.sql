-- =============================================================
-- Migration 002: Dietary preferences + multi-store price scraping
-- =============================================================

-- ---------- USER DIETARY PROFILE ----------
-- Granular: tags (vegan/vegetarian/keto/etc) + likes/dislikes + allergens
alter table profiles
  add column if not exists postal_code text,
  add column if not exists dietary_tags text[] default '{}',          -- ['vegetarian','no-gluten','no-dairy']
  add column if not exists allergens text[] default '{}',             -- ['peanuts','shellfish','eggs']
  add column if not exists disliked_ingredients text[] default '{}',  -- ['cilantro','aceitunas']
  add column if not exists liked_ingredients text[] default '{}',     -- ['tofu','plátano','aguacate']
  add column if not exists disliked_textures text[] default '{}',     -- ['gomoso','crujiente']
  add column if not exists max_meal_kcal int,
  add column if not exists notes_for_ai text;                          -- "no me gusta cocinar más de 10 min"

-- ---------- STORES ----------
create table if not exists stores (
  id text primary key,                    -- 'walmart' | 'soriana' | 'chedraui' | 'sumesa'
  display_name text not null,
  logo_url text,
  base_url text not null,
  scraper_kind text not null,             -- 'api' | 'html' | 'apify'
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
-- Lo que aparece en la shopping list. Independiente de cada tienda.
create table if not exists products (
  id text primary key,                    -- 'huevo-18', 'tofu-firme-400g'
  canonical_name text not null,
  category text not null,                 -- 'Proteínas base' | 'Lácteos' | etc
  unit text not null,                     -- 'piezas' | 'g' | 'ml' | 'L'
  unit_qty numeric not null,              -- 18, 400, 1000
  tags text[] default '{}',               -- ['vegetarian','vegan','no-gluten','dairy','egg']
  is_vegetarian boolean default true,
  is_vegan boolean default false,
  contains_dairy boolean default false,
  contains_eggs boolean default false,
  contains_gluten boolean default false,
  created_at timestamptz default now()
);

-- ---------- PRODUCT ALIASES PER STORE ----------
-- Mapping: cómo se llama "Huevo 18pz" en Walmart vs en Soriana
create table if not exists product_store_aliases (
  id bigserial primary key,
  product_id text not null references products(id) on delete cascade,
  store_id text not null references stores(id),
  store_product_id text,                  -- SKU/id en la tienda
  query_term text not null,               -- término para buscar en su API
  matched_name text,                      -- nombre exacto que devolvió la tienda
  unique (product_id, store_id)
);

-- ---------- PRICE SNAPSHOTS ----------
-- Histórico de precios. NO sobrescribir — append-only para tracking de tendencias.
create table if not exists price_snapshots (
  id bigserial primary key,
  product_id text not null references products(id) on delete cascade,
  store_id text not null references stores(id),
  postal_code text,                       -- CP usado en el scrape; null = nacional
  price_mxn numeric not null,
  price_per_unit numeric,                 -- price_mxn / unit_qty (para comparar)
  in_stock boolean default true,
  promo_label text,                       -- "2x1" | "20% off" | null
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
  store_id text references stores(id),
  postal_code text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text,                            -- 'running' | 'ok' | 'partial' | 'failed'
  products_total int default 0,
  products_ok int default 0,
  products_failed int default 0,
  error text
);

-- ---------- AI MEAL REPLAN HISTORY ----------
-- Cuando user cambia prefs, guardamos el re-plan generado por Claude.
create table if not exists meal_replans (
  id bigserial primary key,
  user_id text not null references profiles(id),
  triggered_by text not null,             -- 'prefs_changed' | 'manual'
  meals_changed jsonb not null,           -- [{original_id, new_name, new_ingredients, reason}]
  prefs_snapshot jsonb not null,          -- copy of profile prefs at time of replan
  generated_at timestamptz default now()
);
