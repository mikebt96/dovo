-- ════════════════════════════════════════════════════════════════════
-- Schedulers del Veredicto y de duelos (directiva del consejo 2026-06-10, P0-3).
-- "Cualquier UI encima de un cron fantasma es escenografía": la función
-- cerrar_semana_rachas existía desde 20260601120000 pero NADIE la llamaba —
-- la racha del trato jamás avanzaba ni se rompía. Y los duelos vencidos
-- dependían de que un humano tocara "cerrar duelo".
--
--  · cerrar-semana-rachas: dom 23:59 CDMX (lun 05:59 UTC — CDMX es UTC-6 fijo,
--    sin DST desde 2022). El Veredicto del Domingo.
--  · cerrar-duelos: diario 00:05 CDMX (06:05 UTC) — cierra duelos con
--    periodo_fin vencido y rechaza propuestas zombis >48h (RETO_ACEPTAR_HORAS).
-- ════════════════════════════════════════════════════════════════════

-- pg_cron (patrón Supabase). El job corre como el rol que lo agenda (postgres).
create extension if not exists pg_cron;
grant usage on schema cron to postgres;

-- ── Cierre diario de duelos vencidos ──
-- cerrar_reto exige is_reto_party(auth.uid()) O auth.role() = 'service_role';
-- desde pg_cron no hay JWT (auth.role() → anon). Esta función NO está expuesta
-- a clientes (grant solo service_role) y fija el claim local a la transacción
-- para pasar el gate sin duplicar la lógica de cierre (cero drift).
create or replace function core.cerrar_duelos_vencidos()
returns int
language plpgsql
security definer
set search_path = core
as $$
declare
  v_hoy date := ((now() at time zone 'America/Mexico_City'))::date;
  v_n int := 0;
  r record;
begin
  -- gate de cerrar_reto: claim service_role, local a esta transacción
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform set_config('request.jwt.claim.role', 'service_role', true);

  -- periodo_fin es exclusivo (half-open): vencido cuando hoy >= periodo_fin
  for r in
    select id from core.retos
    where estado in ('aceptado','activo') and periodo_fin <= v_hoy
  loop
    perform core.cerrar_reto(r.id);   -- idempotente, fija ganador por puntos_base
    v_n := v_n + 1;
  end loop;

  -- propuestas sin respuesta >48h → rechazadas (la promesa de UI ya es mecánica)
  update core.retos
     set estado = 'rechazado', updated_at = now()
   where estado = 'propuesto'
     and created_at < now() - interval '48 hours';

  return v_n;
end;
$$;

revoke execute on function core.cerrar_duelos_vencidos() from public;
grant execute on function core.cerrar_duelos_vencidos() to service_role;

-- ── Agenda (idempotente: re-aplicar la migración no duplica jobs) ──
do $do$
begin
  -- job legado creado fuera de migraciones ('5 0 * * 1' = dom 18:05 CDMX):
  -- juzgaba la semana 6 HORAS ANTES del cierre real y, por la guarda de
  -- idempotencia de cerrar_semana_rachas, preemptaba al job correcto. Los
  -- check-ins del domingo en la noche no contaban para el Veredicto.
  if exists (select 1 from cron.job where jobname = 'cerrar-rachas-semanal') then
    perform cron.unschedule('cerrar-rachas-semanal');
  end if;
  if exists (select 1 from cron.job where jobname = 'cerrar-semana-rachas') then
    perform cron.unschedule('cerrar-semana-rachas');
  end if;
  if exists (select 1 from cron.job where jobname = 'cerrar-duelos') then
    perform cron.unschedule('cerrar-duelos');
  end if;
end
$do$;

-- Veredicto del Domingo. El `- interval '1 hour'` ancla el cálculo a la semana
-- que CIERRA aunque el job arranque tarde y cruce la medianoche CDMX (si
-- corriera 06:01 UTC ya sería lunes en CDMX y date_trunc daría la semana nueva).
select cron.schedule(
  'cerrar-semana-rachas',
  '59 5 * * 1',
  $job$select core.cerrar_semana_rachas((date_trunc('week', (now() at time zone 'America/Mexico_City') - interval '1 hour'))::date)$job$
);

select cron.schedule(
  'cerrar-duelos',
  '5 6 * * *',
  $job$select core.cerrar_duelos_vencidos()$job$
);
