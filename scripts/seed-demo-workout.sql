-- Seed F9 para el demo: progresión de 3 semanas de Iván (ganar_musculo) en los básicos,
-- para que "la vez pasada → hoy intenta X" se vea en el recorrido del inversionista.
-- Idempotente. El plan sample se autogenera al entrar a /grupo/[id]/rutina (no se siembra).
-- Las fechas son relativas a current_date → sobrevive al re-seed semanal.
do $$
declare v_miembro uuid;
begin
  select tm.id into v_miembro
  from core.trato_miembros tm join core.users u on u.id = tm.user_id
  where u.email = 'demo+ivan@dovofit.com' limit 1;
  if v_miembro is null then raise notice 'Iván no encontrado'; return; end if;

  delete from core.exercise_logs where miembro_id = v_miembro;

  insert into core.exercise_logs (miembro_id, fecha, exercise_slug, series)
  select v_miembro, v.fecha, v.slug, v.series::jsonb
  from (values
    (current_date - 18, 'sentadilla',  '[{"reps":10,"peso_kg":80},{"reps":10,"peso_kg":80},{"reps":9,"peso_kg":80},{"reps":8,"peso_kg":80}]'),
    (current_date - 18, 'press-banca', '[{"reps":10,"peso_kg":60},{"reps":9,"peso_kg":60},{"reps":8,"peso_kg":60}]'),
    (current_date - 18, 'remo-barra',  '[{"reps":10,"peso_kg":55},{"reps":10,"peso_kg":55},{"reps":9,"peso_kg":55}]'),
    (current_date - 18, 'hip-thrust',  '[{"reps":12,"peso_kg":90},{"reps":12,"peso_kg":90},{"reps":11,"peso_kg":90}]'),
    (current_date - 11, 'sentadilla',  '[{"reps":10,"peso_kg":85},{"reps":10,"peso_kg":85},{"reps":9,"peso_kg":85},{"reps":9,"peso_kg":85}]'),
    (current_date - 11, 'press-banca', '[{"reps":10,"peso_kg":62.5},{"reps":9,"peso_kg":62.5},{"reps":9,"peso_kg":62.5}]'),
    (current_date - 11, 'remo-barra',  '[{"reps":10,"peso_kg":57.5},{"reps":10,"peso_kg":57.5},{"reps":10,"peso_kg":57.5}]'),
    (current_date - 11, 'press-militar','[{"reps":10,"peso_kg":37.5},{"reps":9,"peso_kg":37.5},{"reps":8,"peso_kg":37.5}]'),
    (current_date - 4,  'sentadilla',  '[{"reps":12,"peso_kg":90},{"reps":12,"peso_kg":90},{"reps":12,"peso_kg":90},{"reps":11,"peso_kg":90}]'),
    (current_date - 4,  'press-banca', '[{"reps":12,"peso_kg":65},{"reps":11,"peso_kg":65},{"reps":10,"peso_kg":65}]'),
    (current_date - 4,  'remo-barra',  '[{"reps":12,"peso_kg":60},{"reps":12,"peso_kg":60},{"reps":11,"peso_kg":60}]'),
    (current_date - 4,  'hip-thrust',  '[{"reps":12,"peso_kg":110},{"reps":12,"peso_kg":110},{"reps":12,"peso_kg":110}]'),
    (current_date - 4,  'jalon-al-pecho','[{"reps":12,"peso_kg":62.5},{"reps":11,"peso_kg":62.5},{"reps":10,"peso_kg":62.5}]'),
    (current_date - 4,  'press-militar','[{"reps":12,"peso_kg":40},{"reps":10,"peso_kg":40},{"reps":9,"peso_kg":40}]')
  ) as v(fecha, slug, series);
end $$;
