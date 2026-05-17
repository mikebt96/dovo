-- Roles aislados para enforce privacy-by-architecture.

-- 1) pulse_writer: puede insertar en pulse.eventos_agregados, NO puede tocar core.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'pulse_writer') then
    create role pulse_writer noinherit;
  end if;
end $$;

-- Quitar TODO acceso a core
revoke all on schema core from pulse_writer;
revoke all on all tables in schema core from pulse_writer;
revoke all privileges on schema core from pulse_writer;

-- Dar acceso mínimo a pulse
grant usage on schema pulse to pulse_writer;
grant insert on pulse.eventos_agregados to pulse_writer;
grant usage, select on all sequences in schema pulse to pulse_writer;

-- 2) Verificar que anon/authenticated roles tampoco pueden tocar pulse
revoke all on schema pulse from anon;
revoke all on schema pulse from authenticated;
revoke all on all tables in schema pulse from anon;
revoke all on all tables in schema pulse from authenticated;

-- 3) Crear API role para pulse_writer en Supabase (para generar un anon-like key)
-- En Supabase, esto requiere setear el JWT secret y emitir un token con role 'pulse_writer'.
-- Para local: usar el script supabase/scripts/issue_pulse_key.ts (creado en Task 14.4).

comment on role pulse_writer is 'Role aislado para edge function ingest-pulse-event. No tiene acceso a schema core.';
