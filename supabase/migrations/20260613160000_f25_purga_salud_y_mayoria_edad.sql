-- ════════════════════════════════════════════════════════════════════
-- F25 · LOS DIENTES DEL AVISO v1.0:
-- 1. Mayoría de edad: el aviso fija dovo como servicio 18+ (datos sensibles
--    de salud sin mecanismo de consentimiento parental). 0 filas <18 en prod
--    al aplicar (verificado).
-- 2. Purga de salud revocada (aviso §14): si la última fila de consentimiento
--    'salud' del usuario es revocación con >30 días, sus datos de salud y
--    nutrición SE ELIMINAN — el aviso lo promete, el cron lo cumple.
--    Pendiente conocido: los archivos de storage de body scans se purgan a
--    nivel fila; el objeto en storage se barre en fase nativa (TODO).
-- ════════════════════════════════════════════════════════════════════

-- 1 · mayoría de edad
alter table core.user_perfil_fisico drop constraint if exists user_perfil_fisico_edad_check;
alter table core.user_perfil_fisico
  add constraint user_perfil_fisico_edad_check check (edad between 18 and 120);

-- 2 · purga de salud revocada
create or replace function core.purgar_salud_revocada()
returns int
language plpgsql
security definer
set search_path = core
as $$
declare
  n int := 0;
  u record;
begin
  for u in
    with ultimo as (
      select distinct on (user_id) user_id, otorgado, created_at
      from core.consentimientos
      where tipo = 'salud'
      order by user_id, created_at desc
    )
    select user_id from ultimo
    where otorgado = false and created_at < now() - interval '30 days'
  loop
    -- resumen de actividad (cuelga de checkins del usuario)
    delete from core.actividad_metricas am
    using core.checkins c, core.trato_miembros m
    where am.checkin_id = c.id and c.miembro_id = m.id and m.user_id = u.user_id;

    delete from core.molestias where user_id = u.user_id;
    delete from core.body_scans where user_id = u.user_id;
    delete from core.food_logs where user_id = u.user_id;
    delete from core.meal_plans where user_id = u.user_id;
    delete from core.nutrition_profiles where user_id = u.user_id;
    delete from core.fuentes_salud where user_id = u.user_id;
    delete from core.user_perfil_fisico where user_id = u.user_id;

    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function core.purgar_salud_revocada() from public, anon, authenticated;
grant execute on function core.purgar_salud_revocada() to service_role;

-- cron diario 07:00 UTC = 01:00 CDMX (idempotente: sin revocados >30d = no-op)
do $do$
begin
  if exists (select 1 from cron.job where jobname = 'purgar-salud-revocada') then
    perform cron.unschedule('purgar-salud-revocada');
  end if;
end
$do$;

select cron.schedule(
  'purgar-salud-revocada',
  '0 7 * * *',
  $job$select core.purgar_salud_revocada()$job$
);
