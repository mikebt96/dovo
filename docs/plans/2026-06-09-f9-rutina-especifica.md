# F9 · Rutina específica — prescripción de ejercicios + logging por ejercicio

*Build brief · 2026-06-09 · decidido con Miguel (grill de 4 preguntas)*

## Qué es

Hoy la "rutina" es **disciplinas + frecuencia** (gym 2×, running 2×). F9 la convierte en
**prescripción real por persona**: qué ejercicios ejecutar cada día (hip thrust 4×12,
curl de bíceps 3×10, intervalos 6×400m...) según la **meta** del perfil físico
(ganar_musculo / perder_grasa / mantener), más **logging por ejercicio** (series × reps × peso)
con sugerencia de progresión ("la vez pasada 3×10 @ 40kg — hoy intenta 42.5").

## Decisiones de Miguel

| Pregunta | Decisión |
|---|---|
| Alcance | **Plan prescrito + logging por ejercicio** (la versión profunda) |
| Ubicación | **Evolucionar `/grupo/[id]/rutina`** (no página nueva) |
| Gating | **Plan base free · personalización IA = Pro** (mismo split que F5) |
| Demo | **Seed para Iván** (progresión visible de 3 semanas) |

## Arquitectura (espejo de F5, lecciones aplicadas)

- **Catálogo de ejercicios en TS** (`lib/workout/catalog.ts`, ~60 ejercicios es-MX con
  grupo muscular, patrón, equipo, actividad) — NO tabla SQL, igual que los platillos de F5.
- **Plan = jsonb** en `core.workout_plans` (1 por miembro, `source sample|ai`). El sample
  se autogenera en page load (determinista, nunca llama IA); la IA es botón explícito.
- **Logging** en `core.exercise_logs` (miembro_id, fecha, exercise_slug, series jsonb).
  La progresión se calcula en código desde los últimos logs por slug.
- **Splits por frecuencia de gym**: 1-2× full body A/B · 3× empuje/tirón/pierna ·
  4× upper/lower ×2 · 5+ PPL+UL. Esquemas por objetivo: músculo 8-12 desc 90s ·
  grasa 12-15 desc 45-60s + finisher · mantener mixto 3×10.
- **Cardio/control**: running por objetivo (rodaje/intervalos/tempo), pilates/ballet
  como bloques temáticos del catálogo.
- **Check-in NO se toca**: el motor de puntos sigue igual; tras registrar ejercicios
  la UI recuerda hacer el check-in del día. Integración profunda = fase 2.

### Lecciones aplicadas (review 2026-06-09)

1. Structured outputs: schema SOLO con type/properties/required/enum/description —
   conteos y rangos se validan en código post-parse. `enum` de slugs del catálogo
   para que la IA no invente ejercicios.
2. Rate-limit REAL: 1 regeneración IA por semana por miembro (generated_at + source).
3. `logAppError` en el catch de IA (visible en /admin).
4. "Hoy" con TZ America/Mexico_City, no UTC.
5. Deletes con scoping verificado (no ok:true con 0 filas).
6. Grants explícitos en la migración (gotcha is_reto_party).
7. Errores de Supabase: log + mensaje genérico al cliente, jamás en silencio.

## Tier

`FEATURE_TIERS += workout_ai: "pro"` — la página y el plan base son free (alimentan el
loop diario); solo "personalizar con ia" (equipo disponible, lesiones, preferencias) es Pro.

## Demo

Iván (ganar_musculo, gym 2× + running 2× + pilates 2×) → plan full body A/B autogenerado +
`exercise_logs` de 3 semanas con pesos ascendentes en los básicos (hip thrust, sentadilla,
press banca, remo) para que la progresión se vea en el recorrido del inversionista.
`gen-seed-sql.ts` emite esos logs (sobrevive al re-seed semanal — lección del perfil de nutrición).
