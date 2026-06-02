# Prod schema drift — diagnóstico (2026-06-02)

**Proyecto Supabase:** `chyudsvjllcxdjgjafjo` (dovo, us-east-2, PG17).
**Estado:** investigación read-only. NADA modificado en prod. Pendiente decisión de Miguel.

## Resumen

La BD de producción **no coincide** con las migraciones del repo en `core`. El
check-in de F2 **no funciona en prod** porque `core.checkins` sigue con el schema
viejo v0.x. Además hay un **segundo modelo de datos para la misma app** en `public.*`
(iteración previa en inglés). **Miguel confirmó (2026-06-02): `core` es el canónico**;
`public.*` es legacy a consolidar/descartar.

Prod (`core`) está **casi vacío**: users 1, perfiles 1, actividades 4 (seed); tratos,
miembros, checkins, characters, rutinas = 0. `public` también: profiles/xp/streaks = 2,
resto 0, products 28 (seed de precios). Ningún modelo tiene usuarios reales.

**`core` es autocontenido:** la única FK cross-schema es `core.users → auth.users`.
Nada en `public`/`pulse` depende de `core` → reconciliar `core` no afecta lo demás.

## Diff tabla por tabla (schema `core`)

| Tabla | Estado en prod | Esperado (repo) |
|---|---|---|
| actividades | ✅ dovofit | ok |
| users | ✅ | ok |
| user_perfil_fisico | ✅ dovofit | ok |
| user_character | ✅ dovofit | ok |
| user_streak | ✅ dovofit | ok |
| user_rutinas | ✅ dovofit | ok |
| trato_miembros | ✅ dovofit | ok |
| brand_partners / sponsored_tratos / reward_codes | ✅ (sponsored F1) | ok |
| **tratos** | ❌ **VIEJO v0.x** (`creator_id, partner_id, goal, frecuencia, duracion_dias, recompensa_text, castigo_text, resultado, sponsored_id, partner_email, invite_expires_at`) | dovofit: `nombre_grupo, tipo_grupo, estado, created_by, invite_token` |
| **checkins** | ❌ **VIEJO v0.x** (`trato_id, user_id, cumplido, nota, disputed_*`) | dovofit: `miembro_id, actividad_id, metricas, kcal_calculadas, puntos` |
| **user_scores** | ❌ **VIEJO residual** (`tratos_cerrados, tratos_cumplidos, score_publico, visibility`) — dovofit lo eliminó | no debería existir |

Funciones `core`: apply_checkin ✅(existe, firma ok, pero su INSERT apunta a la
`checkins` dovofit → **falla en runtime** contra la checkins vieja), checkin_visible ✅,
is_trato_member ✅, owns_miembro ✅, set_updated_at ✅. (No está `bump_user_score`:
tabla vieja user_scores sin su trigger.)

## Causa probable

Esta BD nació como **dovo v0.x** (migraciones `core_tratos/core_checkins/core_user_scores`
de 20260517 — schema viejo). El pivot dovofit (`drop_v0x_trato_model` + `dovofit_core_model`,
20260520) figura como **aplicado** en `list_migrations`, pero las tablas con nombre
compartido (`tratos`, `checkins`) **no se dropearon/recrearon** — quedaron en v0.x,
mientras las tablas de nombre nuevo (trato_miembros, user_rutinas, user_character…) sí
se crearon. Resultado: estado mixto. `apply_checkin` se aplicó por el SQL Editor (no
quedó registrada como migración).

El modelo `public.*` (migraciones `food_prefs_and_prices, callmebot, meals_log_snapshot,
xp_events_idempotency, body_photos_bucket, waitlist` del **16-may**, anteriores a
`core_schema` del 17-may) es una **iteración previa de la propia dovofit** (nutrición,
body, gamificación, marketplace, precios de súper, WhatsApp). Origen exacto sin
confirmar (¿otro repo/agente/n8n?). No es otro proyecto; es legacy de la misma app.

## Reconciliación recomendada (cuando se decida)

Como `core` está casi vacío y es solo de dovo (no toca `public` del otro proyecto):

**Opción A — reset limpio de `core`:** `drop schema core cascade` → re-aplicar todas
las migraciones del repo → re-seed actividades. Garantiza prod = repo = local
(verificado). Pierde 1 user + 1 perfil de prueba (re-onboarding trivial). Más limpio.

**Opción B — quirúrgico:** dropear y recrear solo `tratos`/`checkins`/`user_scores`
con el schema dovofit (+ re-FK de trato_miembros→tratos). Preserva user/perfil. Riesgo
de objetos v0.x residuales.

**Aparte (deuda):** mover dovo a su **propio proyecto Supabase** para no compartir BD
con la otra app — elimina la fuente de confusión a futuro.

## RESOLUCIÓN (2026-06-02) — Opción A ejecutada

Miguel autorizó el reset limpio. Aplicado vía MCP (migración `reset_core_to_repo`):
`drop schema core cascade` → recrear `core` desde el DDL canónico (dump del local con
todas las migraciones aplicadas, `public.gen_random_bytes`→`extensions.gen_random_bytes`)
→ re-seed de 4 actividades.

**Verificado en prod:** `checkins` y `tratos` ahora son el modelo dovofit nuevo,
`user_scores` eliminada, 13 tablas. Smoke test del loop F2 real (en transacción con
rollback): `apply_checkin` subió stats (fue=10, res=4, nivel=1), `compliance_miembro`
y `cerrar_semana_rachas` corrieron OK. prod `core` = repo. F2 y F3b funcionan en prod.

**Cron F3b (infra Supabase, NO en el repo):** `pg_cron` habilitado + job
`cerrar-rachas-semanal` (`5 0 * * 1` UTC) → `core.cerrar_semana_rachas(date_trunc('week',now())::date - 7)`.
Para reproducir en otro entorno, re-ejecutar ese `cron.schedule`.

**Migraciones aplicadas a prod fuera del repo** (one-off, no recrear): `reset_core_to_repo`,
`schedule_weekly_streak_close`, y `apply_checkin` (pegada en SQL Editor en su día). El
modelo en sí ya está en las migraciones del repo; `public.*` (legacy) quedó intacto.
