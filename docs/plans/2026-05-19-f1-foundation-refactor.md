# Plan F1 · Foundation Refactor (dovofit v2)

**Fecha**: 2026-05-19
**Spec**: `docs/specs/2026-05-19-dovofit-v2-spec.md`
**Predecesor**: v0.4b-pulse (último tag del v0.x)
**Meta de F1**: tener el esqueleto del nuevo modelo de datos + Google OAuth + onboarding 3 pantallas funcionando, con el typecheck y build pasando. NO incluye scoring, gamificación, nutrición (esos son F2+).

---

## Contexto

El v0.x (dovo commitment device) llegó a v0.4b con: auth magic link, tratos goal-libre con duración fija, check-ins binarios, streak, perfil/ajustes, email, pulse. Ahora pivotamos a dovofit. F1 reemplaza el núcleo del modelo de trato sin romper lo reusable (auth infra, email, pulse, legal).

**Estado de BD**: limpia (0 tratos, 0 checkins, solo Miguel en users). Podemos hacer cambios destructivos de schema sin migrar datos de producción.

---

## Decisiones de F1

### D1 · Migración destructiva controlada del schema de tratos

Como no hay datos en producción, dropeamos las tablas del modelo viejo (`core.tratos` con goal/duracion, `core.checkins` binario, `core.user_scores`) y creamos el nuevo modelo. Las migrations viejas quedan en el historial (no se borran archivos) pero agregamos migrations nuevas que hacen `drop` + `create`.

**Why no editar las migrations viejas**: el historial de migrations es append-only. Supabase trackea cuáles se aplicaron. Editar una ya aplicada causa drift. Siempre se agrega una migration nueva.

### D2 · Google OAuth además de (no en vez de) magic link

Agregamos Google OAuth como método primario, pero mantenemos magic link como fallback (algunos users no tienen Google, o prefieren email). El onboarding UI destaca Google; magic link es el "o usa tu correo".

**Why mantener ambos**: cero costo de mantener magic link (ya funciona), y da opción. Google es default por fricción menor.

### D3 · Catálogo de actividades como tabla seeded, no enum

`core.actividades` es tabla (no enum Postgres) para permitir agregar actividades sin migration. Seed inicial: gym, pilates, ballet, running. Cada una con metadata (kcal/unidad, métricas, stats afectados).

### D4 · F1 NO incluye scoring real

El cálculo de puntos/BMR/character stats es F2. En F1 las tablas existen (`user_character`, `user_perfil_fisico`) pero el check-in solo registra métricas crudas. El scoring se conecta en F2. Esto mantiene F1 enfocado en estructura.

---

## Tareas

### T1 · Migration: drop modelo viejo de tratos

`supabase/migrations/20260520120000_drop_v0x_trato_model.sql`
- `drop table core.checkins cascade`
- `drop table core.user_scores cascade`
- `drop table core.tratos cascade`
- `drop type core.trato_estado, core.trato_resultado, core.score_visibility`
- Mantener: core.users, core.sponsored_tratos, core.brand_partners, core.reward_codes, pulse.*
- Drop el trigger/función `core.bump_user_score` (ya no aplica)

### T2 · Migration: nuevo modelo core dovofit

`supabase/migrations/20260520120001_dovofit_core_model.sql`
- `core.user_perfil_fisico`: user_id PK, peso_kg, altura_cm, edad, genero, nivel_actividad (enum), objetivo (enum), experiencia (enum null), lesiones text[], bmr_calculado numeric, updated_at
- `core.actividades`: id, slug unique, nombre, modality, kcal_por_min numeric, metricas_requeridas text[], stats_primary text[], stats_secondary text[], activa bool
- `core.tratos` (rework): id, nombre_grupo, tipo_grupo (enum: pareja/pequeno/grande), estado (enum: activo/archivado), created_by, created_at
- `core.trato_miembros`: id, trato_id, user_id, role (default 'member'), joined_at. Unique (trato_id, user_id)
- `core.user_rutinas`: id, miembro_id FK trato_miembros, nombre, is_default bool, is_travel bool, actividades jsonb (array de {actividad_id, frecuencia_semanal, duracion_min}), created_at
- `core.checkins` (rework): id, miembro_id, actividad_id, fecha, metricas jsonb, created_at. (kcal/puntos se agregan en F2)
- `core.user_character`: user_id PK, fue/res/flex/vel/equ/vit numeric default 0, nivel int default 1, xp numeric default 0, prestige int default 0, class_name text default 'Novato', updated_at
- `core.user_streak`: user_id PK, current_streak_weeks int default 0, max_streak int default 0, last_cumplido_week date null
- RLS en todas + grants a authenticated/service_role (siguiendo patrón de `20260519120000_grant_core_pulse_permissions.sql`)

### T3 · Migration: seed catálogo de actividades

`supabase/migrations/20260520120002_seed_actividades.sql`
- Insert gym, pilates, ballet, running con metadata inicial:
  - gym: kcal_por_min ~6, metricas [peso_kg, reps, sets], stats_primary [FUE], stats_secondary [VEL, VIT]
  - running: kcal_por_min ~10, metricas [distancia_km, tiempo_min], stats_primary [RES], stats_secondary [VEL]
  - ballet: kcal_por_min ~6, metricas [tiempo_min, intensidad], stats_primary [FLEX, EQU], stats_secondary [RES]
  - pilates: kcal_por_min ~4, metricas [tiempo_min, intensidad], stats_primary [FLEX, EQU], stats_secondary [FUE]
- (valores kcal aproximados, refinables en F2)

### T4 · Aplicar migrations vía MCP + verificar

- Aplicar T1, T2, T3 vía `apply_migration`
- Verificar con `list_tables` que el nuevo modelo existe + viejo borrado
- Verificar grants

### T5 · Google OAuth setup

- Documentar en plan: Miguel debe habilitar Google provider en Supabase Dashboard → Auth → Providers → Google (client ID + secret de Google Cloud Console)
- `lib/actions/auth.ts`: agregar `signInWithGoogle()` action usando `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `app/auth/callback/route.ts`: ya maneja code exchange; verificar que funciona con OAuth flow (no solo magic link)

### T6 · Schemas Zod nuevos

- `lib/schemas/perfil-fisico.ts`: peso/altura/edad/genero/nivel/objetivo + opcionales experiencia/lesiones
- `lib/schemas/grupo.ts`: crear grupo (nombre, tipo)
- `lib/schemas/rutina.ts`: rutina (nombre, actividades array)
- Borrar `lib/schemas/trato.ts`, `lib/schemas/checkin.ts` (modelo viejo) — o reescribir

### T7 · Server actions nuevas

- `lib/actions/perfil.ts`: `saveProfileFisico(input)` + cálculo BMR (Mifflin-St Jeor)
- `lib/actions/grupos.ts`: `crearGrupo(input)`, `unirseAGrupo(token)`, `invitarMiembro`
- Borrar/reescribir `lib/actions/tratos.ts`, `checkins.ts`, `resolveTrato.ts` (modelo viejo)
- Mantener `lib/actions/profile.ts` (ajustes), adaptar a nuevo modelo

### T8 · Onboarding 3 pantallas

- `app/(onboarding)/welcome/page.tsx`: hero + Google OAuth + magic link fallback
- `app/(onboarding)/perfil/page.tsx`: encuesta perfil físico (6 campos + expand opcional)
- `app/(onboarding)/grupo/page.tsx`: crear o unirse a grupo
- Redirect logic: si user sin perfil_fisico → /welcome/perfil; si sin grupo → /welcome/grupo; else → home

### T9 · Limpiar UI del modelo viejo

- Borrar `app/(app)/trato/` completo (new/Wizard, [id], invite components del modelo viejo)
- Borrar `app/_components/trato-card.tsx`
- Reescribir `app/_components/home-authed.tsx` → nuevo home combo (esqueleto, sin scoring real)
- Mantener `/perfil`, `/ajustes` (adaptar referencias al nuevo modelo)
- `app/invite/[token]/` → adaptar a invitación de grupo (no trato viejo)

### T10 · Typecheck + build + commit

- `npx tsc --noEmit` limpio
- `npx next build` pasa
- Commit por chunks lógicos (migrations / oauth / schemas+actions / onboarding / cleanup)
- Tag `v0.5-f1-foundation`

---

## Archivos críticos

| Path | Acción |
|---|---|
| `supabase/migrations/20260520120000_drop_v0x_trato_model.sql` | Crear |
| `supabase/migrations/20260520120001_dovofit_core_model.sql` | Crear |
| `supabase/migrations/20260520120002_seed_actividades.sql` | Crear |
| `lib/actions/auth.ts` | Edit (Google OAuth) |
| `lib/actions/perfil.ts`, `grupos.ts` | Crear |
| `lib/actions/tratos.ts`, `checkins.ts`, `resolveTrato.ts` | Borrar |
| `lib/schemas/perfil-fisico.ts`, `grupo.ts`, `rutina.ts` | Crear |
| `lib/schemas/trato.ts`, `checkin.ts` | Borrar |
| `app/(onboarding)/` | Crear (3 pantallas) |
| `app/(app)/trato/` | Borrar |
| `app/_components/home-authed.tsx` | Rewrite |
| `app/_components/trato-card.tsx` | Borrar |

---

## Verificación F1

1. Migrations aplicadas, nuevo modelo en BD, viejo borrado
2. Google OAuth: Miguel se loguea con Google (requiere setup Dashboard)
3. Onboarding: nuevo user → 3 pantallas → aterriza en home
4. Perfil físico guardado con BMR calculado
5. Crear grupo + invitar (link funciona)
6. typecheck + build limpios
7. Tag v0.5-f1-foundation

---

## Lo que F1 NO hace (queda para F2+)

- Cálculo de puntos por check-in (F2)
- Character stats que suben (F2)
- Ciclos semanales/mensuales (F3)
- Niveles/XP/decay (F3)
- Marketplace recompensas (F4)
- Nutrición AI (F5)
- Stripe (F7)

F1 es **estructura + onboarding + grupos**. El "juego" empieza en F2.

---

## Dependencias externas (Miguel)

1. **Google Cloud Console**: crear OAuth credentials (client ID + secret) para el proyecto
2. **Supabase Dashboard**: Auth → Providers → Google → pegar client ID + secret + redirect URL
3. (Opcional) Confirmar valores kcal del catálogo o dejar los aproximados de T3
