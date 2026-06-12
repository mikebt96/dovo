-- ════════════════════════════════════════════════════════════════════
-- duo_nutricion v2: la DOSIS del compa visible en el menú (founder: "si a
-- miguel le tocan 2000 kcal y a andrea 1700, ajustarlo a cada uno").
-- La RPC ahora expone el físico mínimo de cada miembro para que el server
-- calcule sus macros con la MISMA fórmula (macrosObjetivo) — mismos platillos,
-- y junto a tus kcal ves las suyas. Cambia el return type ⇒ drop + create.
-- ════════════════════════════════════════════════════════════════════

drop function if exists core.duo_nutricion(uuid);

create function core.duo_nutricion(p_trato_id uuid)
returns table (
  user_id uuid,
  nombre text,
  objetivo text,
  restricciones text[],
  vetos text[],
  menus_distintos int,
  peso_kg numeric,
  altura_cm numeric,
  edad int,
  genero text,
  nivel_actividad text,
  bmr_calculado numeric,
  listo boolean
)
language sql
security definer
set search_path = core
as $$
  select
    m.user_id,
    u.nombre,
    pf.objetivo,
    coalesce(np.restricciones, '{}') as restricciones,
    coalesce(np.vetos, '{}') as vetos,
    coalesce(np.menus_distintos, 5) as menus_distintos,
    pf.peso_kg,
    pf.altura_cm,
    pf.edad,
    pf.genero,
    pf.nivel_actividad,
    pf.bmr_calculado,
    (pf.user_id is not null and np.user_id is not null) as listo
  from core.trato_miembros m
  join core.users u on u.id = m.user_id
  left join core.user_perfil_fisico pf on pf.user_id = m.user_id
  left join core.nutrition_profiles np on np.user_id = m.user_id
  where m.trato_id = p_trato_id
    and core.is_trato_member(p_trato_id, auth.uid());
$$;

revoke execute on function core.duo_nutricion(uuid) from public;
grant execute on function core.duo_nutricion(uuid) to authenticated, service_role;
