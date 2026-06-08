-- F4 Marketplace de recompensas (sin keys). Recompensas desbloqueables por RACHA del
-- dúo (unlock derivado y determinista: racha >= threshold, sin tabla de estado),
-- wishlist por miembro visible al co-miembro, y cupones de partners placeholder.

-- ── Catálogo global de recompensas (gestionado por seed/admin, no por usuarios) ──
create table if not exists core.rewards (
  id uuid primary key default gen_random_uuid(),
  icono text not null default '🎁',
  titulo text not null,
  descripcion text not null,
  racha_threshold int not null check (racha_threshold >= 0),
  orden int not null default 0,
  activo boolean not null default true
);

-- ── Cupones de partners (mecánica lista; partners reales = contenido posterior) ──
create table if not exists core.partner_discounts (
  id uuid primary key default gen_random_uuid(),
  partner text not null,
  icono text not null default '🏷️',
  titulo text not null,
  codigo text not null,
  racha_threshold int not null default 0 check (racha_threshold >= 0),
  orden int not null default 0,
  activo boolean not null default true
);

-- ── Wishlist por miembro; el co-miembro del dúo la ve (refuerza el "dúo") ──
create table if not exists core.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references core.users(id) on delete cascade,
  titulo text not null,
  url text,
  created_at timestamptz not null default now()
);
create index if not exists wishlist_user_idx on core.wishlist(user_id);

-- ── RLS ──
alter table core.rewards enable row level security;
alter table core.partner_discounts enable row level security;
alter table core.wishlist enable row level security;

drop policy if exists rewards_read on core.rewards;
create policy rewards_read on core.rewards for select to authenticated using (activo);

drop policy if exists partner_discounts_read on core.partner_discounts;
create policy partner_discounts_read on core.partner_discounts for select to authenticated using (activo);

drop policy if exists wishlist_read on core.wishlist;
create policy wishlist_read on core.wishlist for select to authenticated
  using (user_id = auth.uid() or core.shares_trato(user_id, auth.uid()));

drop policy if exists wishlist_insert on core.wishlist;
create policy wishlist_insert on core.wishlist for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists wishlist_delete on core.wishlist;
create policy wishlist_delete on core.wishlist for delete to authenticated
  using (user_id = auth.uid());

-- ── Grants ── (la política wishlist_read llama shares_trato → authenticated necesita EXECUTE,
-- misma lección que el grant de is_reto_party que ocultaba el duelo activo)
grant usage on schema core to authenticated;
grant select on core.rewards to authenticated;
grant select on core.partner_discounts to authenticated;
grant select, insert, delete on core.wishlist to authenticated;
grant execute on function core.shares_trato(uuid, uuid) to authenticated;

-- ── Catálogo seed (global, idempotente por titulo/codigo) ──
insert into core.rewards (icono, titulo, descripcion, racha_threshold, orden)
select * from (values
  ('🥤','Botella dovo','Termo de acero con tu clase grabada.',2,1),
  ('🧦','Calcetas de entreno','Par de compresión, edición dúo.',4,2),
  ('👕','Playera del dúo','Con el nombre de tu dúo al frente.',8,3),
  ('🎧','Audífonos deportivos','Inalámbricos, resistentes al sudor.',12,4),
  ('⌚','Banda de actividad','Para cerrar el loop con tus métricas.',24,5),
  ('🏆','Fin de semana fit','Escapada activa para el dúo (retiro aliado).',52,6)
) v(icono,titulo,descripcion,racha_threshold,orden)
where not exists (select 1 from core.rewards r where r.titulo = v.titulo);

insert into core.partner_discounts (partner, icono, titulo, codigo, racha_threshold, orden)
select * from (values
  ('NutriCo','🥗','20% en tu primer plan de comidas','DOVO20',0,1),
  ('RunStore','👟','15% en tenis de running','DOVORUN',4,2),
  ('YogaFlow','🧘','2x1 en clase de yoga','DOVOYOGA',6,3),
  ('GymAliado','💪','1 mes de gimnasio aliado','DOVOGYM',8,4)
) v(partner,icono,titulo,codigo,racha_threshold,orden)
where not exists (select 1 from core.partner_discounts p where p.codigo = v.codigo);
