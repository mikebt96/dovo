# Plan 3 · Check-ins + Streak + Resolución

**Fecha**: 2026-05-19
**Spec source**: `docs/specs/2026-05-16-mvp-tratos-pulse-design.md` secciones 3.1, 3.2, 3.3 (Pantallas 05 y 06), 3.4, 11.3
**Predecesor**: Plan 2 (tratos creation + invitation) shipped @ tag `v0.2-tratos`
**Sucesor**: Plan 4 (edge function Pulse, Tratos Patrocinados, email transactional, push)

---

## Contexto

Plan 2 cerró el flow de creación + invitación: A crea trato → manda link → B abre invite → B acepta → trato pasa a `estado='activo'` con `accepted_at`. Lo que NO existe todavía:

1. **Check-in diario** — cada miembro del dúo marca si cumplió hoy.
2. **Streak grid** — visualización del progreso día por día.
3. **Dispute flag** — el otro miembro puede marcar un check-in como disputado.
4. **Resolución** — al llegar `accepted_at + duracion_dias`, el trato pasa a `cerrado` con un `resultado` calculado.
5. **Score update** — al cerrar, `core.user_scores` actualiza `tratos_cerrados` y `tratos_cumplidos` para cada miembro.

Las tablas `core.checkins` y `core.user_scores` ya existen con RLS (Plan 1, migrations `20260516120005_core_checkins.sql` y `20260516120006_core_user_scores.sql`). Este plan solo agrega code path + trigger.

---

## Decisiones de diseño

### D1 · Resolución lazy on-view (no cron)

**Decisión**: la primera request a `/trato/[id]` después de `accepted_at + duracion_dias` que encuentra el trato aún en `estado='activo'` dispara `resolveTrato(tratoId)` server-side antes de renderizar.

**Why not cron**: requiere edge function + scheduler + manejo de retries. Plan 4 ya planea edge functions. Para MVP, lazy es suficiente — el cierre es visible cuando el user vuelve a abrir el trato.

**Why not "ambos confirman manualmente"**: spec dice "al cierre del período, ambos confirman quién cumplió". Pero esto bloquea cierres si uno no responde. Lazy + cálculo automático por check-ins ya es accountability suficiente. La resolución manual queda para v0.2 si el feedback la pide.

### D2 · Self-report restringido a "hoy"

El usuario solo puede crear/editar su check-in del día actual (UTC normalizado a MX timezone). No puede backfillar días pasados ni adelantar futuros.

**Why**: previene gaming (acumular cumplimientos retroactivos cuando ya viste que tu partner falló). El spec menciona "cada quien marca cumplimiento del día/semana" — el "del día" implica acción presente.

### D3 · Cálculo de cumplimiento por frecuencia

| Frecuencia | Días requeridos |
|---|---|
| `daily` | `duracion_dias` |
| `weekdays` | número de L-V en `[accepted_at, accepted_at + duracion_dias)` |
| `3x_per_week` | `ceil(duracion_dias / 7) * 3` |
| `weekly` | `ceil(duracion_dias / 7)` |

User cumple el trato sii `count(checkins where user_id = X and cumplido = true and not disputed) >= días_requeridos`.

### D4 · Resultado del trato

| Condición | Resultado |
|---|---|
| Hay ≥1 disputa con `disputed_at` y sin resolución manual | `sin_resolver` |
| Ambos miembros cumplieron threshold | `ambos_cumplieron` |
| Solo creator cumplió | `uno_fallo` (partner falló) |
| Solo partner cumplió | `uno_fallo` (creator falló) |
| Ninguno cumplió | `ambos_fallaron` |

### D5 · Streak grid

Grid mobile-first, cada celda = 1 día del `duracion_dias` total.

| Estado de la celda | Color | Trigger |
|---|---|---|
| Cumplido | `verde-cal` (token) | checkin existe + `cumplido=true` + no disputa |
| Fallido | `rojo-ladrillo` | día pasado sin checkin O checkin + `cumplido=false` |
| Disputado | `ambar` | checkin existe + `disputed_at not null` |
| Hoy (sin checkin) | `ink` outline + pulse | día actual sin checkin del user |
| Futuro | `mute` opacity-30 | día > today |

Se renderiza el grid del user actual Y del partner (dos filas paralelas).

### D6 · Dispute UX

En el grid del partner, cada celda con checkin + `cumplido=true` muestra al hover/tap un mini-botón "marcar disputa". Click expande inline textarea con `min 10 chars`. Submit pasa por server action `disputeCheckin`.

Disputa **no se puede deshacer** desde UI MVP (queda en BD por integridad). Si fue accidental, queda como `sin_resolver` al cierre. Acepta el costo.

---

## Tareas

### T1 · Trigger SQL para auto-update de `user_scores`

**Migration**: `20260519130000_user_scores_trigger.sql`

```sql
-- Al transicionar trato a 'cerrado', inserta/actualiza user_scores para ambos miembros
-- según el resultado calculado.
create or replace function core.bump_user_score()
returns trigger as $$
begin
  -- Solo dispara cuando estado transiciona a 'cerrado' (no en otros updates)
  if (old.estado != 'cerrado' and new.estado = 'cerrado') then
    -- Creator
    insert into core.user_scores (user_id, tratos_cerrados, tratos_cumplidos)
    values (
      new.creator_id,
      1,
      case when new.resultado in ('ambos_cumplieron') then 1
           when new.resultado = 'uno_fallo' and ... then 1
           else 0 end
    )
    on conflict (user_id) do update set
      tratos_cerrados = core.user_scores.tratos_cerrados + 1,
      tratos_cumplidos = core.user_scores.tratos_cumplidos + ...,
      updated_at = now();
    -- Partner (mismo patrón)
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trato_cerrado_bumps_score
  after update of estado on core.tratos
  for each row execute function core.bump_user_score();
```

Nota: el cálculo de "cumplió o no" requiere saber quién falló en `uno_fallo`. Voy a agregar dos columnas a `core.tratos` para almacenar resultado individual:
- `creator_cumplio boolean null`
- `partner_cumplio boolean null`

Se setean en el momento del `resolveTrato` server-side y el trigger las lee.

### T2 · `lib/schemas/checkin.ts`

Zod schemas:
- `createCheckinSchema`: `{ trato_id, cumplido: boolean, nota?: string (max 280) }`
- `disputeCheckinSchema`: `{ checkin_id, reason: string (min 10, max 280) }`

### T3 · `lib/actions/checkins.ts`

Server actions:
- `createCheckin(input)` — valida que el user es miembro del trato, valida que `fecha=today`, valida que trato está en `activo`, valida que no hay otro checkin para hoy (constraint unique ya lo cubre, pero return error claro), insert.
- `disputeCheckin(input)` — valida que user es el OTRO miembro del trato (no el dueño del checkin), valida reason length, update checkin con `disputed_*`.

### T4 · `lib/actions/resolveTrato.ts`

Server action invocada desde `/trato/[id]/page.tsx` cuando el server component detecta `now() >= accepted_at + duracion_dias` y estado `activo`:

1. Calcula `dias_requeridos` por frecuencia (función pura en `lib/utils/streak.ts`).
2. Cuenta checkins cumplidos non-disputed para creator y partner.
3. Setea `creator_cumplio = (count >= dias_requeridos)`, same para partner.
4. Si hay disputas pendientes → `resultado = 'sin_resolver'`.
5. Else calcula `resultado` por la matriz de D4.
6. Update `core.tratos` con `estado='cerrado'`, `closed_at=now()`, `resultado`, `creator_cumplio`, `partner_cumplio`.
7. El trigger T1 dispara el bump de scores.

### T5 · `lib/utils/streak.ts`

Funciones puras (sin DB):
- `diasRequeridos(frecuencia, duracion_dias, accepted_at): number`
- `expectedDayState(fecha, today, checkin): 'cumplido' | 'fallido' | 'disputado' | 'hoy' | 'futuro'`
- `streakActual(checkins, today): number` — racha consecutiva más reciente

### T6 · Vista `activo` en `app/(app)/trato/[id]/page.tsx`

Actualmente solo maneja `pendiente_aceptacion`. Agregar branch para `activo`:

- Header: goal + countdown ("faltan 17 días").
- Sección **tu progreso**: streak grid del user + `CheckinButton` (solo si hoy sin checkin).
- Sección **{partner_nombre}**: streak grid del partner + dispute UI.
- Si user ya hizo checkin hoy: muestra "✓ hecho · puedes editar hasta las 23:59" con form para cambiar cumplido + nota.

Componentes nuevos:
- `app/(app)/trato/[id]/_components/StreakGrid.tsx` (client, recibe array de checkins + duracion + accepted_at)
- `app/(app)/trato/[id]/_components/CheckinButton.tsx` (client, abre form inline)
- `app/(app)/trato/[id]/_components/DisputeForm.tsx` (client, expand-inline en celda del partner)

### T7 · Vista `cerrado` en `app/(app)/trato/[id]/page.tsx`

Agregar branch para `estado='cerrado'`:
- Header con `resultado` traducido a texto MX coloquial:
  - `ambos_cumplieron` → "los dos cumplieron 💪"
  - `uno_fallo` → "{nombre} cumplió, {nombre} falló"
  - `ambos_fallaron` → "ninguno cumplió 🫠"
  - `sin_resolver` → "quedó sin resolver"
- Streak grids finales de ambos.
- Texto del recompensa/castigo aplicable.

### T8 · Tests

`tests/integration/checkins-flow.test.ts` (requiere `SUPABASE_LOCAL_SERVICE_KEY` igual que el de Plan 2):
- Crear trato + accept → user puede crear checkin de hoy
- User NO puede crear checkin con fecha != today
- Partner puede disputar el checkin del otro
- Partner NO puede disputar su propio checkin
- Después de `duracion_dias` segundos (mock por modificar `accepted_at`), llamar `resolveTrato` → estado cerrado + scores actualizados
- Resultado `ambos_cumplieron` correcto cuando ambos pasaron threshold

### T9 · Smoke test manual + tag v0.3

1. Crear trato con duracion_dias=2 (corto para probar)
2. Accept en incognito
3. Ambos check-in
4. Modificar `accepted_at` via MCP a `now() - interval '3 days'` para simular pasado el período
5. Refrescar `/trato/[id]` — debe dispararse resolveTrato y mostrar vista `cerrado`
6. Verificar `core.user_scores` actualizado para ambos
7. Tag `v0.3-checkins`, push

---

## Archivos críticos

| Path | Acción | Por qué |
|---|---|---|
| `supabase/migrations/20260519130000_user_scores_trigger.sql` | Crear | Trigger + columnas `creator_cumplio`/`partner_cumplio` |
| `lib/schemas/checkin.ts` | Crear | Zod inputs |
| `lib/actions/checkins.ts` | Crear | createCheckin + disputeCheckin |
| `lib/actions/resolveTrato.ts` | Crear | Lazy resolution logic |
| `lib/utils/streak.ts` | Crear | Funciones puras de cálculo |
| `app/(app)/trato/[id]/page.tsx` | Edit | Agregar branches `activo` y `cerrado` |
| `app/(app)/trato/[id]/_components/StreakGrid.tsx` | Crear | Visualization |
| `app/(app)/trato/[id]/_components/CheckinButton.tsx` | Crear | Mark today |
| `app/(app)/trato/[id]/_components/DisputeForm.tsx` | Crear | Flag partner checkin |
| `tests/integration/checkins-flow.test.ts` | Crear | Integration coverage |

## Out of scope (queda para Plan 4+)

- Edge function que corra el cierre proactivo (cron)
- Email/push de recordatorio diario de check-in
- Edit/delete del checkin después del día (queda locked a las 23:59)
- Re-open de trato cerrado / undo
- UI del score público en perfil del user (Pantalla 07 · P1)
- Resolución por confirmación mutua (vs auto-cálculo)
- Disputa con arbitraje
