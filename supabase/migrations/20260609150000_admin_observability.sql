-- Consola de admin · observabilidad interna. Dos piezas:
--  1. core.app_errors — errores capturados por la app (boundary client, webhook, resolvers).
--     SOLO service_role (como stripe_events): el cliente reporta vía server action validada.
--  2. core.self_scan() — el sistema se audita a sí mismo (RLS, policies, definer expuestos,
--     subs inconsistentes, salud de datos). SECURITY DEFINER, EXECUTE solo service_role.

create table if not exists core.app_errors (
  id uuid primary key default gen_random_uuid(),
  origen text not null,                 -- client-boundary | stripe-webhook | tier-resolver | ...
  mensaje text not null,
  stack text,
  url text,
  user_id uuid references core.users(id) on delete set null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists app_errors_created_idx on core.app_errors(created_at desc);

alter table core.app_errors enable row level security;
-- Sin policies a propósito: cerrada salvo service_role (bypass). Patrón stripe_events.
grant select, insert, update, delete on core.app_errors to service_role;

-- ── Self-scan: auditoría interna de seguridad y consistencia ──
create or replace function core.self_scan()
returns jsonb
language plpgsql security definer
set search_path = core, pg_catalog
as $$
declare
  findings jsonb := '[]'::jsonb;
  r record;
  n int;
begin
  -- 1 · tablas del schema core SIN RLS (crítico)
  for r in
    select c.relname
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'core' and c.relkind = 'r' and not c.relrowsecurity
  loop
    findings := findings || jsonb_build_object(
      'check','rls_off','status','critical',
      'detail', format('tabla core.%s SIN row level security', r.relname));
  end loop;

  -- 2 · tablas con RLS y CERO policies (esperadas: stripe_events, app_errors — service-only)
  for r in
    select c.relname
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname='core' and c.relkind='r' and c.relrowsecurity
      and not exists (select 1 from pg_policies p where p.schemaname='core' and p.tablename=c.relname)
      and c.relname not in ('stripe_events','app_errors')
  loop
    findings := findings || jsonb_build_object(
      'check','rls_no_policy','status','warn',
      'detail', format('core.%s tiene RLS pero ninguna policy (¿cerrada a propósito?)', r.relname));
  end loop;

  -- 3 · funciones SECURITY DEFINER en core ejecutables por anon (solo leaderboard_demo debe)
  for r in
    select p.proname
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname='core' and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
      and p.proname <> 'leaderboard_demo'
  loop
    findings := findings || jsonb_build_object(
      'check','definer_anon','status','critical',
      'detail', format('core.%s (SECURITY DEFINER) es ejecutable por anon', r.proname));
  end loop;

  -- 4 · suscripciones inconsistentes: tier pagado con status que no da acceso
  select count(*) into n from core.subscriptions
  where tier <> 'free' and status not in ('active','trialing','past_due');
  if n > 0 then
    findings := findings || jsonb_build_object(
      'check','subs_inconsistentes','status','warn',
      'detail', format('%s suscripción(es) con tier pagado y status sin acceso', n));
  end if;

  -- 5 · errores de app en 24h
  select count(*) into n from core.app_errors
  where created_at > now() - interval '24 hours' and not resolved;
  if n > 0 then
    findings := findings || jsonb_build_object(
      'check','errores_24h','status', case when n >= 10 then 'critical' else 'warn' end,
      'detail', format('%s error(es) sin resolver en las últimas 24h', n));
  end if;

  -- 6 · funnel: usuarios sin perfil físico (drop de onboarding)
  select count(*) into n from core.users u
  where not exists (select 1 from core.user_perfil_fisico p where p.user_id = u.id);
  if n > 0 then
    findings := findings || jsonb_build_object(
      'check','onboarding_drop','status','ok',
      'detail', format('%s usuario(s) sin perfil físico (drop de onboarding)', n));
  end if;

  return jsonb_build_object(
    'ok', not exists (
      select 1 from jsonb_array_elements(findings) f
      where f->>'status' in ('critical')
    ),
    'findings', findings,
    'scanned_at', now()
  );
end;
$$;

revoke execute on function core.self_scan() from public;
revoke execute on function core.self_scan() from anon;
revoke execute on function core.self_scan() from authenticated;
grant execute on function core.self_scan() to service_role;
