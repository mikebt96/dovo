-- Higiene cazada por el propio self_scan: las funciones trigger del opt-out
-- pegajoso (20260613120000) nacieron con el grant default de EXECUTE a
-- PUBLIC. Las funciones `returns trigger` no son invocables vía RPC ni con
-- select directo ("trigger functions can only be called as triggers"), así
-- que no había exploit — pero el patrón del repo es revocar explícito en
-- todo SECURITY DEFINER. El trigger sigue funcionando: corre como dueño de
-- la tabla, no necesita grant del invocador.

revoke execute on function core.pulse_excluir_tratos_del_user() from public, anon, authenticated;
revoke execute on function core.pulse_excluir_al_unirse() from public, anon, authenticated;
