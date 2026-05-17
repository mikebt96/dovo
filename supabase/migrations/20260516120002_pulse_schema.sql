-- Schema pulse: agregados anónimos para inteligencia conductual.
-- Aislado físicamente de schema core. NUNCA contiene user_id, trato_id, ni contenido textual.

create schema if not exists pulse;

comment on schema pulse is 'Agregados anónimos para Pulse DOVO. Privacy-by-architecture: aislado de core, k-anonymity >= 100 enforced en queries.';
