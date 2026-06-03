# dovo — pendientes

## ⏳ Activar el email de resumen mensual (rápido)
La edge function `monthly-summary` está desplegada y el cron `resumen-mensual`
(día 1, 13:00 UTC) ya corre, pero es **fail-soft**: sin `RESEND_API_KEY` cuenta los
envíos como `skipped` y no manda nada.

**Para activarlo:**
> Supabase → Edge Functions → `monthly-summary` → **Secrets** → añadir
> `RESEND_API_KEY` (y `RESEND_FROM_EMAIL`). Opcional: `CRON_SECRET` para blindar
> la invocación (la función ya lo valida si está presente).

Verificar luego: invocar la función con un mes que tenga datos y confirmar `sent > 0`.

## Deuda técnica de infra
- **`public.*` legacy**: ~25 tablas de una iteración previa de la app (nutrición,
  body, gamificación, marketplace, precios). Decidir consolidar lo aprovechable
  (p.ej. catálogo de 28 `products`) o descartar. Ver `docs/PROD_DRIFT_2026-06-02.md`.
- **Proyecto Supabase propio para dovo**: hoy comparte BD con esa iteración previa.
  Migrar a su propio proyecto elimina la confusión a futuro.
- **Infra fuera del repo**: `reset_core_to_repo`, los 2 pg_cron y la edge function
  se aplicaron vía MCP (one-off / infra Supabase). Si se migra de proyecto, re-crear.

## Siguiente feature (candidatos)
- **Verificar flujo real end-to-end** en la app desplegada (onboarding → grupo →
  rutina → check-in → stats/racha) contra el prod reconciliado. *Recomendado primero.*
- **F4 · Marketplace de recompensas** (CORE en el spec, tier Free): recompensas por racha.
- **F5 · Nutrición / VIT**: comidas, macros, el stat Vitalidad.
- **Prestige**: reset con doble gate (nivel 50 + racha 26).
