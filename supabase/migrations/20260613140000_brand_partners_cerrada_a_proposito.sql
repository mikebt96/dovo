-- ════════════════════════════════════════════════════════════════════
-- brand_partners: de "cerrada por accidente" a CERRADA A PROPÓSITO.
--
-- El self-scan avisaba: "core.brand_partners tiene RLS pero ninguna policy
-- (¿cerrada a propósito?)". Diagnóstico (2026-06-12): tabla del pilar 2 del
-- MVP original (marcas que patrocinan tratos), 0 filas, ningún código la usa.
-- RLS sin policy = inaccesible al cliente (correcto), pero los grants de
-- INSERT/SELECT/UPDATE a authenticated eran letra muerta confusa.
--
-- Decisión: se CONSERVA (con la inteligencia de premios, el programa de
-- marcas la va a revivir — ya tiene rfc/contacto_email/logo_url) pero
-- cerrada explícitamente: solo service_role hasta que el programa viva.
-- ════════════════════════════════════════════════════════════════════

revoke all on core.brand_partners from authenticated, anon;

comment on table core.brand_partners is
  'Marcas socias del programa de premios/descuentos. CERRADA A PROPÓSITO: '
  'solo service_role (admin) hasta que el programa de marcas viva. '
  'Revivirá con la inteligencia de premios (decisión founder 2026-06-12).';

-- self_scan: brand_partners entra a la allowlist de cierres deliberados —
-- un warn permanente entrena a ignorar warns.
create or replace function core.self_scan()
returns jsonb
language plpgsql
security definer
set search_path to 'core', 'pg_catalog'
as $function$
declare
  findings jsonb := '[]'::jsonb;
  r record;
  n int;
begin
  for r in
    select c.relname from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'core' and c.relkind = 'r' and not c.relrowsecurity
  loop
    findings := findings || jsonb_build_object('check','rls_off','status','critical',
      'detail', format('tabla core.%s SIN row level security', r.relname));
  end loop;

  for r in
    select c.relname from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname='core' and c.relkind='r' and c.relrowsecurity
      and not exists (select 1 from pg_policies p where p.schemaname='core' and p.tablename=c.relname)
      -- cierres DELIBERADOS (documentados en comment de cada tabla):
      and c.relname not in ('stripe_events','app_errors','brand_partners')
  loop
    findings := findings || jsonb_build_object('check','rls_no_policy','status','warn',
      'detail', format('core.%s tiene RLS pero ninguna policy (¿cerrada a propósito?)', r.relname));
  end loop;

  for r in
    select p.proname from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname='core' and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
      and p.proname <> 'leaderboard_demo'
  loop
    findings := findings || jsonb_build_object('check','definer_anon','status','critical',
      'detail', format('core.%s (SECURITY DEFINER) es ejecutable por anon', r.proname));
  end loop;

  select count(*) into n from core.subscriptions
  where tier <> 'free' and status not in ('active','trialing','past_due');
  if n > 0 then
    findings := findings || jsonb_build_object('check','subs_inconsistentes','status','warn',
      'detail', format('%s suscripción(es) con tier pagado y status sin acceso', n));
  end if;

  select count(*) into n from core.app_errors
  where created_at > now() - interval '24 hours' and not resolved;
  if n > 0 then
    findings := findings || jsonb_build_object('check','errores_24h',
      'status', case when n >= 10 then 'critical' else 'warn' end,
      'detail', format('%s error(es) sin resolver en las últimas 24h', n));
  end if;

  select count(*) into n from core.users u
  where not exists (select 1 from core.user_perfil_fisico p where p.user_id = u.id);
  if n > 0 then
    findings := findings || jsonb_build_object('check','onboarding_drop','status','ok',
      'detail', format('%s usuario(s) sin perfil físico (drop de onboarding)', n));
  end if;

  return jsonb_build_object(
    'ok', not exists (select 1 from jsonb_array_elements(findings) f where f->>'status' in ('critical')),
    'findings', findings,
    'scanned_at', now());
end;
$function$;
