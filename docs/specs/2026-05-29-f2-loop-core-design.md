# dovofit · F2 · Loop core (rutina → check-in → puntos → stats → racha)

**Fecha**: 2026-05-29
**Estado**: Diseño aprobado · listo para writing-plans
**Spec source**: `docs/specs/2026-05-19-dovofit-v2-spec.md` §3.3, §3.4, §3.5, §4
**Predecesor**: F1 (commits `7c8ee75` + `4f30dc9`) — modelo de datos, Google OAuth, onboarding, grupos N-miembros

---

## 1 · Objetivo

Hacer que "la parte de los usuarios" cobre vida: el loop diario que mueve el juego.

```
RutinaForm → guardarRutina → user_rutinas
Home "Hoy" lee rutina default → actividades de hoy
CheckinForm → crearCheckin → calcularCheckin() [TS] → apply_checkin RPC [1 tx] → stats++ → racha
Home re-render: barras de stats + racha actualizadas
```

Hoy F1 dejó el esqueleto: el header de 6 stats (siempre en 0), la sección "Hoy" como placeholder, y los grupos funcionales. Las tablas (`user_character`, `user_streak`, `user_rutinas`, `checkins`, `actividades` seeded) y los schemas Zod (`rutina.ts`, `perfil-fisico.ts`) existen, pero **sin UI ni scoring**: faltan `lib/actions/rutina.ts` y `lib/actions/checkins.ts`, no existe `calcularPuntos`, y `checkins.kcal_calculadas`/`puntos` nunca se llenan.

F2 cierra ese gap. **El "juego" empieza aquí.**

## 2 · Alcance

### Dentro
- Scoring puro en TS (kcal → puntos → deltas de stats), testeable.
- RPC atómico `core.apply_checkin` que inserta el check-in + sube stats + actualiza racha en una transacción.
- Rutina builder por-miembro (actividad × frecuencia × duración).
- Check-in con métricas estructuradas, UX inline desde "Hoy" (smart default 1-2 taps + expand).
- "Hoy" real en el home + empty states.
- i18n EN/ES de todo lo nuevo.

### Fuera (→ F3+)
- Niveles / XP recompute / decay / class names AI (F3).
- Ciclos semanales/mensuales con cierre automático + email (F3).
- Racha por compliance real de la rutina (en F2 la racha es semanal simple; ver §6).
- Variantes de rutina travel/recovery (el schema las soporta; F2 solo crea la default).
- VIT desde nutrición (F5), marketplace (F4), Stripe (F7).

## 3 · Decisiones de arquitectura

### D1 · Scoring en TS, aplicación vía RPC atómico (híbrido)

`calcularPuntos` vive en TS como source of truth (spec §3.4 lo pide). Pero subir los stats del personaje es un read-modify-write (`fue += puntos`); para garantizar atomicidad y reusar la misma lógica cuando F3 cierre ciclos, un RPC Postgres `apply_checkin` hace el insert + el incremento + la racha en **una transacción**.

**Why no server-action puro secuencial**: el read-modify-write no es atómico; aunque la concurrencia de un solo user es baja en MVP, el cierre de ciclo de F3 (múltiples miembros, batch) sí la necesita. Hacer el RPC ahora evita reescribir después.

**Why no trigger SQL puro**: metería las fórmulas MET/BMR en plpgsql (difícil de testear/iterar) y contradice el spec que quiere la lógica en TS.

### D2 · F2 no toca nivel/XP/class_name

El RPC sube las 6 stats (`fue/res/flex/vel/equ/vit`) y nada más del character. `nivel` se queda en 1, `xp` en 0, `class_name` en "Novato". La progresión de nivel, el decay y los class names AI son F3. Esto mantiene F2 honesto: no medio-implementamos leveling.

### D3 · Racha semanal simple en F2

`user_streak.current_streak_weeks` se incrementa cuando hay ≥1 check-in en una semana ISO consecutiva a la anterior; si hay hueco, reset a 1. La racha **por compliance de rutina** (cumpliste tus frecuencias) es F3, junto con los ciclos. La columna ya existe; F2 solo la alimenta con la versión simple.

### D4 · Constantes de scoring = balance de juego, decisión de Miguel

Todas las constantes (kcal MET por actividad ya seeded, factores de intensidad, pesos de distribución de stats) viven en un solo lugar para tunearlas sin tocar lógica. Los valores de §5 son una **propuesta defendible y tuneable**, no canon.

## 4 · Componentes (unidades aisladas)

| Unidad | Path | Responsabilidad | Depende de |
|---|---|---|---|
| Scoring kcal | `lib/scoring/kcal.ts` | métricas + perfil → kcal | actividad (catálogo), perfil_fisico |
| Scoring puntos | `lib/scoring/puntos.ts` | kcal + bmr → puntos | — |
| Scoring stats | `lib/scoring/stats.ts` | puntos + actividad → deltas de las 6 stats | actividad.stats_primary/secondary |
| Scoring orquestador | `lib/scoring/index.ts` | `calcularCheckin()` = los 3 anteriores → `{kcal, puntos, deltas}` | los 3 de arriba |
| RPC apply_checkin | migration SQL | insert checkin + bump character + racha, 1 tx, SECURITY DEFINER | `owns_miembro`, tablas core |
| Action rutina | `lib/actions/rutina.ts` | `guardarRutina(input)` valida + upsert `user_rutinas` | `rutinaSchema`, supabase server |
| Action check-in | `lib/actions/checkins.ts` | `crearCheckin(input)` → `calcularCheckin` → RPC | scoring, RPC, supabase server |
| Rutina UI | `app/(app)/grupo/[id]/rutina/{page,RutinaForm}.tsx` | armar rutina semanal | action rutina, catálogo |
| Check-in UI | componente desde "Hoy" | quick-log + expand métricas | action check-in |
| Home "Hoy" | `app/_components/home-authed.tsx` (rewrite sección) | leer rutina default → actividades de hoy + CTA | rutina, check-in UI |

Cada unidad de scoring es pura y determinista: se entiende y testea sin tocar la BD.

## 5 · Fórmulas de scoring (propuesta tuneable)

```
factorIntensidad:
  ballet/pilates: intensidad (1-5) → 0.6 + (intensidad-1) × 0.2     // 0.6 .. 1.4
  running:        derivado de pace (distancia_km / tiempo_min)       // default 1.0 si falta
  gym:            derivado de volumen (peso_kg × reps × sets) ligero  // default 1.0
  default:        1.0

kcal   = actividad.kcal_por_min × duracion_min × (peso_kg / 70) × factorIntensidad
puntos = round( kcal / (bmr / 1440) )     // kcal por minuto-basal; normaliza por metabolismo

deltas:
  cada stat en stats_primary   += puntos
  cada stat en stats_secondary += puntos × 0.4
```

- `peso_kg / 70`: el seed `kcal_por_min` es para ~70 kg; escala por peso real.
- `duracion_min`: viene de las métricas del check-in (o de la rutina como default).
- Display: el header de stats ya comprime con `log10(v+1)/2.2`, así que los stats son acumuladores crudos.

## 6 · Flujo de datos detallado

### 6.1 Armar rutina
1. User entra a `/grupo/[id]/rutina` (redirigido post-join si no tiene rutina, o desde la sección "tu rutina" del grupo).
2. `RutinaForm` resuelve su `miembro_id` (de `trato_miembros` por `trato_id` + `auth.uid()`), lista el catálogo `core.actividades activa=true`, arma items `{actividad_id, frecuencia_semanal, duracion_min}`.
3. `guardarRutina` valida con `rutinaSchema`, verifica `owns_miembro`, upsert en `user_rutinas` (una `is_default=true` por miembro).

### 6.2 Check-in
1. Home "Hoy" lee la rutina default del miembro y muestra las actividades sugeridas de hoy con botón quick-log.
2. Quick-log: smart default 1-2 taps (duración prellenada de la rutina). Expand opcional para llenar `metricas_requeridas` de la actividad (peso/reps/sets, distancia/tiempo, intensidad).
3. `crearCheckin(input)`:
   - resuelve `miembro_id`, carga `actividad` + `user_perfil_fisico`.
   - `calcularCheckin(actividad, metricas, perfil)` [TS puro] → `{kcal, puntos, deltas}`.
   - llama RPC `core.apply_checkin(miembro_id, actividad_id, fecha, metricas, kcal, puntos, deltas)`.
   - `revalidatePath("/")`.
4. RPC en 1 tx: verifica ownership → `insert checkins` (con kcal/puntos) → `update user_character` (suma deltas a las 6 stats) → `update user_streak` (racha semanal simple) → devuelve character.
5. Home re-render: barras de stats + racha actualizadas.

## 7 · Manejo de errores

- Actions devuelven el patrón existente `Result<T> = {ok:true,data} | {ok:false,error}`.
- Validación Zod en el borde (igual que `saveProfileFisico`): input inválido → `{ok:false}` con primer issue.
- Sin perfil físico → no se puede calcular puntos: el check-in redirige/avisa "completa tu perfil" (no debería pasar, el onboarding lo exige, pero se valida).
- RLS + `owns_miembro` en el RPC: un user no puede hacer check-in por otro miembro.
- Métricas faltantes en quick-log: se usan defaults de la rutina; el scoring nunca recibe `NaN` (clamps en las fns puras).

## 8 · Testing

- **Vitest unit** (`tests/unit/scoring.test.ts`): `calcularKcal`, `calcularPuntos`, `distribuirStats`, `calcularCheckin`. Casos: cada modality, intensidad min/max, peso/bmr extremos, métricas faltantes (defaults), determinismo. Es la superficie de mayor valor.
- **Integration** (opcional, `tests/integration`, skip sin Supabase local): RPC `apply_checkin` sube stats y racha correctamente; idempotencia de racha en misma semana.

## 9 · Archivos

**Nuevos**
- `lib/scoring/kcal.ts`, `puntos.ts`, `stats.ts`, `index.ts`
- `lib/actions/rutina.ts`, `lib/actions/checkins.ts`
- `supabase/migrations/2026XXXXXXXXXX_apply_checkin_rpc.sql`
- `app/(app)/grupo/[id]/rutina/page.tsx` + `RutinaForm.tsx`
- componente de check-in (desde "Hoy")
- `tests/unit/scoring.test.ts`

**Modificados**
- `app/_components/home-authed.tsx` ("Hoy" real)
- `app/(app)/grupo/[id]/page.tsx` (sección "tu rutina")
- `app/(app)/onboarding/grupo/...` (redirect a rutina post-join si no hay)
- `messages/en.json`, `messages/es.json` (keys nuevas)

## 10 · Verificación F2

1. User arma rutina → persiste en `user_rutinas`.
2. "Hoy" muestra las actividades de la rutina default.
3. Check-in quick (1-2 taps) y check-in con métricas → ambos insertan en `checkins` con `kcal_calculadas` + `puntos` llenos.
4. Las 6 barras de stats suben tras el check-in.
5. Racha semanal incrementa en semana consecutiva, resetea con hueco.
6. `nivel`/`xp`/`class_name` intactos (F3).
7. Tests unit de scoring verdes; `tsc --noEmit` y `next build` limpios.
