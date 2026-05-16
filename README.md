# dovo · Plan v1

Plan semanal de dúo con disciplina compartida, castigos consensuales y premios reales.

**Para:** Mike (`/mike`) y Andy (`/andy`)
**No es:** SaaS, multi-tenant, native. Ver `SAAS_MIGRATION_PATH.md` para el plan v2.

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind v4 (CSS-first config)
- Supabase (Phase 2 — wired pero no obligatorio en v1)
- Claude Sonnet 4.6 (Phase 4)
- WhatsApp Cloud API (Phase 5)
- Deploy: Vercel

## Quickstart

```bash
cd ~/dovo
npm install
cp .env.example .env.local        # opcional para v1 estático
npm run dev
```

Abre http://localhost:3000

## Estado actual (v1 — Fase 1 completa)

✅ Scaffold + design system
✅ Schema Supabase definido (`supabase/schema.sql`)
✅ Seed data migrado del HTML por persona
✅ Home selector Mike/Andy
✅ Dashboard por persona con stats stub
✅ Página `/super` con lista filtrada por persona
✅ Página `/prep` con tareas por persona
✅ Página `/semana` y `/semana/[day]` con checks + log de pesos
✅ Página `/actividad` para ballet/pilates/running/etc
✅ Página `/tienda` con catálogo de premios (read-only por ahora)
✅ Página `/pareja` con streaks + catálogo de castigos (read-only)

## Pendiente (sigue Fase 2)

- [ ] Wire Supabase: crear API routes server-side con service_role
- [ ] Migración localStorage → cloud
- [ ] Streaks reales: cron diario que evalúa "todo cumplido = +1 día"
- [ ] XP + niveles + coins en DB
- [ ] Pair debts: trigger automático al romper streak
- [ ] Logging granular: subir Supabase no solo "done" sino sets/reps/weight reales
- [ ] Photo upload + Supabase Storage

## Pendiente (Fase 3-5)

- [ ] AI Coach Vision (análisis foto)
- [ ] Weekly Coach Review (Claude API semanal)
- [ ] WhatsApp daily nudges (templates Meta pre-aprobados)
- [ ] Sorpresas random 5%
- [ ] Editor de premios y castigos
- [ ] PWA manifest + service worker (offline support)

## Diseño

DNA: Editorial 2D dark, paleta lime accent + cyan (Mike) + pink (Andy), tipografía Syne + Space Mono. **Sin 3D en v1.**

## Estructura

```
app/
  page.tsx                     # Home selector Mike/Andy
  [profile]/
    layout.tsx                 # Top nav + validación de perfil
    page.tsx                   # Dashboard
    super/page.tsx             # Lista de súper filtrada
    prep/page.tsx              # Prep dominical filtrado
    semana/page.tsx            # Vista de 7 días
    semana/[day]/page.tsx      # Detalle del día (meals + entreno)
    actividad/page.tsx         # Log ballet/pilates/running
    tienda/page.tsx            # Catálogo de premios
    pareja/page.tsx            # Streaks + deudas + castigos
  components/
    CheckList.tsx              # Lista checkable con localStorage
    ExerciseLogger.tsx         # Log de peso/reps/RPE por ejercicio
    ActivityLog.tsx            # Log de actividades no-gym

lib/
  types.ts                     # TS types
  profile.ts                   # PROFILES + helpers
  dates.ts                     # Day key helpers
  data/
    days.ts                    # Plan semanal (estructura)
    meals.ts                   # 54 comidas
    training.ts                # 26 ejercicios
    shopping.ts                # 28 items de súper
    prep.ts                    # 5 tareas de prep dominical
    rewards.ts                 # Premios + castigos seed

supabase/
  schema.sql                   # Postgres schema (Phase 2)
```

## Storage actual

v1 usa `localStorage` para todos los checks. **Riesgo:** si cambias de navegador o limpias cache, pierdes el progreso. Phase 2 mueve todo a Supabase.

## Deploy a Vercel

```bash
vercel
```

Setear ENV vars en Vercel dashboard (mismas de `.env.example`).
