-- Hardening: rls_auto_enable es SECURITY DEFINER y heredaba EXECUTE de PUBLIC
-- + grants explícitos a anon/authenticated, así que aparecía invocable vía
-- /rest/v1/rpc (advisor 0028/0029). Es una función de event trigger (ensure_rls,
-- ddl_command_end) que auto-habilita RLS en tablas nuevas de public — sigue en
-- uso, NO dropear. Llamarla directo falla de todos modos (las funciones
-- event_trigger solo las dispara el sistema, y ese disparo no chequea EXECUTE),
-- pero revocamos por higiene igual que con core.apply_checkin.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
