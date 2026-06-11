-- ════════════════════════════════════════════════════════════════════
-- Nutrición v2 + plan de dúo (spec del founder 2026-06-10, mock-first).
--
-- · El wizard pregunta lo que preguntaría un nutriólogo del deporte: cuántos
--   MENÚS DISTINTOS crear (3/5/7 — rotan sobre la semana), presupuesto y
--   dieta ya existían; ahora también recordamos VETOS (la palomita de "no me
--   gustó" cambia el platillo en automático y NO vuelve a aparecer) y
--   FAVORITOS (el motor los prefiere).
-- · core.duo_nutricion: la regla de oro del dúo — UN plan, dosis de cada
--   quien. El motor necesita el objetivo/restricciones/vetos del compa para
--   generar los MISMOS platillos (RLS los hace ilegibles desde el cliente):
--   RPC definer gated por is_trato_member, mismo patrón que estado_trato.
--   Ambos generan con los mismos insumos compartidos ⇒ mismos platillos,
--   kcal personales (determinismo = sincronía sin coordinación).
-- ════════════════════════════════════════════════════════════════════

alter table core.nutrition_profiles
  add column if not exists menus_distintos int not null default 5,
  add column if not exists vetos text[] not null default '{}',
  add column if not exists favoritos text[] not null default '{}';

-- check separado (add column if not exists no re-aplica checks)
do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'nutrition_profiles_menus_distintos_check'
  ) then
    alter table core.nutrition_profiles
      add constraint nutrition_profiles_menus_distintos_check
      check (menus_distintos in (3, 5, 7));
  end if;
end
$do$;

-- ── Insumos del plan compartido del dúo ──
create or replace function core.duo_nutricion(p_trato_id uuid)
returns table (
  user_id uuid,
  objetivo text,
  restricciones text[],
  vetos text[],
  menus_distintos int,
  listo boolean
)
language sql
security definer
set search_path = core
as $$
  select
    m.user_id,
    pf.objetivo,
    coalesce(np.restricciones, '{}') as restricciones,
    coalesce(np.vetos, '{}') as vetos,
    coalesce(np.menus_distintos, 5) as menus_distintos,
    (pf.user_id is not null and np.user_id is not null) as listo
  from core.trato_miembros m
  left join core.user_perfil_fisico pf on pf.user_id = m.user_id
  left join core.nutrition_profiles np on np.user_id = m.user_id
  where m.trato_id = p_trato_id
    and core.is_trato_member(p_trato_id, auth.uid());
$$;

revoke execute on function core.duo_nutricion(uuid) from public;
grant execute on function core.duo_nutricion(uuid) to authenticated, service_role;
