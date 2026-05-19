# Plan 4b · Edge function `ingest-pulse-event`

**Fecha**: 2026-05-19
**Spec ref**: secciones 5.3, 5.4, 5.7 + decisiones 11.1
**Predecesor**: v0.4d-email
**Sucesor**: posible Plan 4c (Tratos Patrocinados) o 4g (onboarding)

---

## Goal

Cuando ocurre un evento del producto (`trato_creado`, `trato_aceptado`, `checkin_registrado`, `trato_cerrado`), se dispara un POST fire-and-forget a una edge function de Supabase que:

1. Verifica `core.users.pulse_opt_out = false` para el user.
2. Recibe dimensions ya bucketed (sin PII).
3. Inserta a `pulse.eventos_agregados`.

El client de la app (server actions) NUNCA escribe directo en `pulse`. Solo la edge function lo hace.

---

## Decisiones

### D1 · Soft isolation, no hard

El spec describe ideal `pulse_role no puede leer core`. En MVP con un solo Supabase project, ambos schemas comparten el mismo `service_role`. El aislamiento real es:

- Schemas separados (`core` vs `pulse`)
- RLS bloquea acceso desde el client normal a `pulse`
- Solo la edge function escribe a `pulse`

Upgrade a hard isolation (dos projects con keys separadas) queda para Año 2 cuando haya revenue para justificar la infra duplicada.

### D2 · Bucketing client-side, edge function solo escribe

El server action calcula los buckets antes de dispatch porque tiene los datos del trato en mano. La edge function solo hace:
1. Lookup `core.users.pulse_opt_out` (gate)
2. INSERT con los buckets recibidos

Ventajas: edge function ligera, lógica de bucketing testeable en server actions, edge function no toca `core.tratos`.

### D3 · Cohort fields defaults a "desconocida"

`cohorte_edad` y `cohorte_ciudad` son NOT NULL pero `core.users` no las tiene. Default `"desconocida"` para no romper el schema. Cuando agregues onboarding con campo cohort (Plan 4g), los nuevos eventos llevan valores reales y los viejos quedan como "desconocida" (no se reescriben).

### D4 · No DP noise en MVP

Spec menciona ε=1 Laplace noise. Para <500 users iniciales, k-anonymity ≥ 100 ya da privacy. DP queda como iteración futura cuando se publique el primer reporte trimestral.

### D5 · Fire-and-forget desde server actions

`dispatchPulseEvent(...)` no awaita. Si la edge function falla (red, timeout, opt-out), el server action no se entera. Aceptable: pérdida ocasional de eventos no rompe la promesa al user. La accuracy del dataset agregado tolera ~1% de eventos perdidos.

### D6 · Categoría: keyword matching mínimo

Para MVP, `categoria` se calcula con simple keyword matching del `goal` text:

| Keyword en goal | Categoría |
|---|---|
| "gym", "pesas", "fuerza", "lift" | `gym` |
| "ballet", "danza", "baile", "dance" | `ballet` |
| "pilates", "yoga", "mat" | `pilates` |
| "corr", "running", "run", "trote" | `running` |
| "cicl", "bici", "cycling" | `cycling` |
| "nat", "swim", "alberca" | `swimming` |
| (otro) | `otro` |

Sin NLP, sin ML. Iteramos cuando los datos lo justifiquen.

---

## Tareas

### T1 · `lib/utils/pulse-buckets.ts`

Funciones puras:
- `categorizeGoal(goal: string): Categoria` — keyword match
- `bucketDuracion(dias: number): "1-7" | "8-30" | "31-90" | "90+"`
- `bucketTasaCumplimiento(cumplidos: number, requeridos: number): string` — `"0-25%"`, `"26-50%"`, `"51-75%"`, `"76-100%"`
- `dowFromDate(iso: string): number` — 0-6

Tests unitarios en `tests/unit/pulse-buckets.test.ts`.

### T2 · `supabase/functions/ingest-pulse-event/index.ts`

Deno edge function:
- POST handler
- Auth: verifica JWT del request (`Authorization: Bearer <token>` del user logueado o service-role para server-to-server)
- Body: `{ evento, user_id, categoria, duracion_dias_bucket, tasa_cumplimiento_bucket, cohorte_edad?, cohorte_ciudad?, es_patrocinado, dow_creacion }`
- Logic:
  1. Verify body con Zod
  2. SELECT `pulse_opt_out` from `core.users` where `id = user_id`
  3. Si opt_out=true → return 204
  4. INSERT a `pulse.eventos_agregados` con defaults para cohorte fields
  5. Return 200

### T3 · Deploy edge function via MCP

Usar `mcp__plugin_supabase_supabase__deploy_edge_function`.

### T4 · `lib/pulse.ts` — client wrapper

```typescript
export function dispatchPulseEvent(opts: PulseEvent): void {
  fetch(`${SUPABASE_URL}/functions/v1/ingest-pulse-event`, {
    method: "POST",
    headers: { ... },
    body: JSON.stringify(opts),
  }).catch(() => {});
}
```

Fire-and-forget. Same pattern que email.

### T5 · Hook en `resolveTrato` (único)

Después del UPDATE exitoso a `estado='cerrado'`:
1. Calcular `categoria`, `duracion_dias_bucket`, `tasa_cumplimiento_bucket` (promedio entre creator + partner), `dow_creacion`, `es_patrocinado`.
2. dispatchPulseEvent fire-and-forget — un evento por trato cerrado.

Importante: enviamos `user_id` del actor (cualquiera de los dos miembros sirve para el gate de opt-out). Si AMBOS tienen opt-out, el evento se omite. Si solo uno, el evento se ingiere porque ambos forman parte del trato y el otro permite contribución.

### T6 · Smoke test

1. Crear trato como Miguel → verificar row en `pulse.eventos_agregados` con evento `trato_creado`
2. Cambiar `pulse_opt_out=true` para Miguel → crear otro trato → verificar que NO se insertó nada
3. Revertir opt_out → trato nuevo → verificar evento insertado

### T7 · Build + commit + tag v0.4b-pulse

---

## Esquema de eventos · MVP simplificado

**Decisión revisada**: el schema `pulse.eventos_agregados` está pensado para 1 row por trato cerrado. Los eventos intermedios (creado, aceptado, checkin) no se ingieren — el research value de pulse vive en cierres con resultado, no en pasos intermedios. Para queries de "cuántos tratos creados sin cerrar", el dashboard interno puede leer `core.tratos` directly con permission del owner.

Solo `resolveTrato` dispara el ingest. 1 trato cerrado = 1 row en pulse.

| Dimension | Source |
|---|---|
| `categoria` | `categorizeGoal(trato.goal)` |
| `duracion_dias_bucket` | `bucketDuracion(trato.duracion_dias)` |
| `tasa_cumplimiento_bucket` | promedio entre creator + partner tasas, bucketed |
| `cohorte_edad` | `"desconocida"` hasta Plan 4g |
| `cohorte_ciudad` | `"desconocida"` hasta Plan 4g |
| `es_patrocinado` | `trato.sponsored_id != null` |
| `dow_creacion` | `dowFromDate(trato.created_at)` |

---

## Out of scope

- Differential Privacy noise (Año 2)
- Hard isolation (Supabase projects separados) (Año 2)
- ML/NLP categorization (cuando categorización keyword falle ≥30%)
- Webhooks de Resend/Stripe para tracking de delivery/payments (no MVP)
- Dashboard interno para queries de pulse (Plan 4c o post-MVP)
- Publicación pública de reportes trimestrales (Año 1 Q4)
