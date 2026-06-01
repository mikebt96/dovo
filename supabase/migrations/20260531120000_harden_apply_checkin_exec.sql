-- Hardening: apply_checkin es SECURITY DEFINER y heredaba EXECUTE de PUBLIC,
-- así que anon podía invocarlo vía /rest/v1/rpc (advisor 0028). El guard interno
-- owns_miembro(auth.uid()) ya lo mitiga, pero revocamos de public por higiene:
-- solo authenticated + service_role (con grant explícito) deben ejecutarlo.
revoke execute on function core.apply_checkin(uuid, uuid, date, jsonb, numeric, numeric, jsonb) from public;
