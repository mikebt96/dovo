-- Permitir que un user inserte su propio row de user_scores (necesario para
-- upsert desde updateScoreVisibility cuando el user aún no tiene tratos cerrados).
create policy scores_insert_self on core.user_scores
  for insert with check (auth.uid() = user_id);
