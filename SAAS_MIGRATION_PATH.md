# SaaS Migration Path

Documento vivo. Cuando v1 valide el mecanismo (4-8 semanas de uso real con Andy),
este es el plan para abrir la app a otras parejas.

## Trigger para empezar v2

Solo cuando se cumplan AL MENOS 3 de estos:

- [ ] Mike y Andy mantienen streak ≥21 días seguidos
- [ ] Los castigos se pagan sin pelea (mecanismo sano, no tóxico)
- [ ] Ambos abren la app sin recordatorio (hábito formado)
- [ ] Han redimido al menos 1 premio
- [ ] Hay 5+ parejas en el círculo de amigos preguntando "cómo lo hacen"

Sin estos, NO hay mercado. La app puede ser técnicamente perfecta y nadie la usará.

## Cambios técnicos al pivotar

### 1. Schema (todos los cambios son ALTER TABLE no destructivos)

```sql
-- Nueva tabla raíz
create table households (
  id uuid primary key default gen_random_uuid(),
  name text,
  plan_tier text default 'free',  -- 'free' | 'pro' | 'couple_pro'
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

-- profiles ahora usa UUID + household_id
alter table profiles
  add column household_id uuid references households(id),
  add column user_uuid uuid default gen_random_uuid(),
  add column email text unique,
  add column auth_user_id uuid references auth.users(id);

-- Migrar Mike/Andy a primera household
insert into households (id, name) values ('00000000-...', 'Mike & Andy');
update profiles set household_id = '00000000-...' where id in ('mike','andy');

-- Todas las tablas con user_id necesitan household_id (índice por household)
alter table meals_log add column household_id uuid references households(id);
-- ... etc para cada tabla
```

### 2. Auth

- Habilitar Supabase Auth (email + magic link)
- RLS: políticas por household_id
- Onboarding: una persona invita a la pareja por email/SMS

### 3. Plan templates

Hoy el seed (`lib/data/meals.ts`, etc) está hardcoded. Para SaaS:

- Crear tabla `plan_templates` con planes pre-armados (cut hombre, recomp mujer, bulk lento, etc.)
- Onboarding: cada usuario elige template, luego edita
- Marketplace en v3: trainers crean planes, los venden

### 4. Stripe + pricing

Tier sugerido (validar con MX market research):

| Tier | Precio | Incluye |
|---|---|---|
| **Free** | $0 | 1 plan, sin AI, sin WhatsApp, sin foto análisis |
| **Couple Pro** | $99 MXN/mes pareja | Todo, AI coach semanal, WhatsApp nudges, fotos ilimitadas |

NO cobrar por usuario individual — el producto SOLO funciona con 2 usuarios. Pricing per-couple.

### 5. Castigos + Premios marketplace

UGC abierto trae problemas: castigos abusivos, premios inapropiados.
- Moderación: catalog público curado + custom privado por household
- Reporte de contenido (si las parejas comparten templates)

### 6. Privacy / Legal

- Body photos = datos sensibles. Encryption at rest (Supabase Storage lo da).
- GDPR: derecho al olvido, export de datos
- TOS clarifying gamification, castigos, no warranty sobre nutrición
- Disclaimer médico (NO sustituye médico/nutriólogo)

## Cambios de mobile

### Fase A — PWA (gratis, 1 semana de polish)

- Manifest.json con app icon, splash, theme color
- Service worker para offline (caching de meals/training del día)
- "Add to home screen" prompt en iOS/Android
- Suficiente para 95% de los users iniciales

### Fase B — Native wrapping (4 semanas)

Solo si tracción justifica. Opciones:

| Approach | Costo | Pros | Cons |
|---|---|---|---|
| **Capacitor** | $ | Wrappea Next.js as-is | Performance mediano |
| **Expo + React Native** | $$$ | Native real, push, biometrics | Rewrite del UI |
| **Tauri Mobile (experimental)** | $$ | Rust+web | Inmaduro, riesgoso |

Recomendación: **Capacitor primero** porque permite shippear sin rewrite.

## Cosas a NO copiar al pivotar

Cosas del v1 que se borran cuando va a SaaS:

- `SECRET_LINK_SLUG` (sustituido por auth)
- Profiles hardcoded 'mike' / 'andy' (sustituido por UUIDs)
- Seed de meals/training específicos (sustituido por templates seleccionables)
- WhatsApp con números hardcoded (cada household configura el suyo)

## Métricas para decidir v3 (native)

Solo construir apps nativas si:

- 100+ parejas pagando ($9.9k MXN MRR mínimo)
- Retention semana 4 > 40%
- NPS ≥ 50
- Requests específicos de feature que requieren native (push fuerte, healthkit, sensors)

Sin esto, native es ego, no producto.
