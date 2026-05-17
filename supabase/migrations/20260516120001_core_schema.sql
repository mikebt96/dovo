-- Schema core: tabla de tratos individuales y datos de usuario.
-- Aislado de schema pulse por arquitectura: roles diferentes acceden cada uno.

create schema if not exists core;

comment on schema core is 'Datos individuales: usuarios, tratos, checkins, scores, sponsored. Aislado físicamente de pulse.';
