-- F1 · Seed del catálogo base de actividades.
-- kcal_por_min son MET-based approximations para persona ~70kg; el cálculo
-- de F2 ajusta por peso real + intensidad del user.

insert into core.actividades (slug, nombre, modality, kcal_por_min, metricas_requeridas, stats_primary, stats_secondary) values
  ('gym',     'Gym',      'fuerza', 6.0,  array['peso_kg','reps','sets'],        array['FUE'],        array['VEL','VIT']),
  ('running', 'Running',  'cardio', 10.0, array['distancia_km','tiempo_min'],    array['RES'],        array['VEL']),
  ('ballet',  'Ballet',   'danza',  6.5,  array['tiempo_min','intensidad'],      array['FLEX','EQU'], array['RES']),
  ('pilates', 'Pilates',  'control',4.0,  array['tiempo_min','intensidad'],      array['FLEX','EQU'], array['FUE'])
on conflict (slug) do nothing;
