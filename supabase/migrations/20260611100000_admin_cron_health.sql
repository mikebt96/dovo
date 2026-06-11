-- ════════════════════════════════════════════════════════════════════
-- Salud de crons en /admin (pregunta de Miguel: "¿dónde veo lo que se cayó?").
-- El Veredicto del Domingo y el cierre de duelos viven en pg_cron — si fallan
-- en silencio, toda la UI encima es escenografía. PostgREST no expone el
-- schema cron: esta RPC definer (owner postgres SÍ lo lee) lo asoma SOLO al
-- service_role (la consola /admin ya corre con él, gated por ADMIN_EMAILS).
-- ════════════════════════════════════════════════════════════════════

create or replace function core.cron_health()
returns table (
  jobname text,
  schedule text,
  active boolean,
  last_status text,
  last_start timestamptz,
  last_msg text
)
language sql
security definer
set search_path = public
as $$
  select
    j.jobname,
    j.schedule,
    j.active,
    d.status,
    d.start_time,
    left(coalesce(d.return_message, ''), 200)
  from cron.job j
  left join lateral (
    select status, start_time, return_message
    from cron.job_run_details
    where jobid = j.jobid
    order by start_time desc
    limit 1
  ) d on true
  order by j.jobname;
$$;

revoke execute on function core.cron_health() from public, anon, authenticated;
grant execute on function core.cron_health() to service_role;
