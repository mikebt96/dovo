-- Postgres requiere GRANT USAGE en el schema + GRANT por tabla, antes de que
-- RLS pueda siquiera evaluar las policies. Sin esto, el role 'authenticated'
-- recibe "permission denied for schema core" antes de tocar RLS.
-- Las policies RLS ya filtran por auth.uid(), así que un GRANT amplio es seguro.

grant usage on schema core to authenticated, anon, service_role;
grant usage on schema pulse to authenticated, service_role;

-- Tablas de core: authenticated puede leer/insertar/actualizar (RLS filtra),
-- service_role bypasea RLS (usado para invite token lookups).
grant select, insert, update on all tables in schema core to authenticated;
grant select, insert, update, delete on all tables in schema core to service_role;

-- Pulse es solo lectura para clients normales — escritura solo desde edge functions
-- con service_role. authenticated NO recibe grants en pulse (es analítica anonimizada
-- y la lectura va por funciones SECURITY DEFINER que se agregarán en Plan 4).
grant select, insert, update, delete on all tables in schema pulse to service_role;

-- Sequences (por si alguna tabla futura usa serial/bigserial)
grant usage, select on all sequences in schema core to authenticated, service_role;
grant usage, select on all sequences in schema pulse to service_role;

-- Default privileges para tablas futuras creadas en estos schemas
alter default privileges in schema core
  grant select, insert, update on tables to authenticated;
alter default privileges in schema core
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema pulse
  grant select, insert, update, delete on tables to service_role;
