-- Faltaba el privilegio DELETE para `authenticated` en tablas que SÍ tienen política
-- RLS de DELETE. El grant base (20260519120000) solo otorgó INSERT/SELECT/UPDATE, así que
-- guardarRutina (borra las rutinas default antes de insertar) y "salir de grupo" fallaban
-- con "permission denied for table ...". RLS sigue gobernando QUÉ filas se pueden borrar.
grant delete on core.user_rutinas to authenticated;
grant delete on core.trato_miembros to authenticated;
