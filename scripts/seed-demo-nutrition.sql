-- Seed F5 para el demo de inversionistas: perfil nutricional de Iván (demo+ivan@dovofit.com).
-- Con esto, al entrar a /nutricion el plan base se autogenera (sample determinista) sin
-- pasar por el onboarding. Idempotente. Aplicar vía MCP execute_sql.
insert into core.nutrition_profiles (user_id, restricciones, presupuesto, comidas_por_dia, preferencias)
select u.id, '{}'::text[], 'medio', 4, 'me gusta picante; nada de hígado'
from core.users u
where u.email = 'demo+ivan@dovofit.com'
on conflict (user_id) do nothing;
