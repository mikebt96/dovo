# Plan 4 · Roadmap (post v0.4a)

**Fecha**: 2026-05-19
**Predecesor**: v0.4a-perfil-ajustes
**Spec source**: `docs/specs/2026-05-16-mvp-tratos-pulse-design.md`

Después de Plan 4a (perfil + ajustes), el MVP tiene cubierto:
- ✅ Auth magic link
- ✅ Crear trato (Pantalla 03)
- ✅ Invitar dúo (Pantalla 04)
- ✅ Home / mis tratos (Pantalla 02)
- ✅ Trato activo + check-ins + streak (Pantalla 05)
- ✅ Resolución (Pantalla 06)
- ✅ Perfil + score (Pantalla 07)
- ✅ Ajustes + opt-out Pulse (Pantalla 08)

Lo que falta para cerrar el MVP:

---

## Plan 4b · Edge function `ingest-pulse-event`

**Spec ref**: secciones 5.3, 5.4, 8 (semana 8), 7.2

### Goal
Cuando ocurre un evento de tipo "checkin", "trato_cerrado", "trato_creado", el frontend lo manda a una edge function que:
1. Verifica `core.users.pulse_opt_out = false`
2. Agrega differential privacy noise (laplace, ε=1)
3. Inserta agregado en `pulse.eventos_agregados` (schema isolated)

### Tareas previstas
- T1 · Migration: schema `pulse` con tabla `eventos_agregados` (ya existe del Plan 1, validar)
- T2 · Edge function en `supabase/functions/ingest-pulse-event/`
- T3 · Client-side wrapper en `lib/pulse.ts` que llama la edge function
- T4 · Hooks en server actions clave (createCheckin, resolveTrato) que dispatch eventos
- T5 · Tests unitarios para DP noise
- T6 · Documentación de privacy claims (para TOS futuros)

### Dependencias
- Supabase CLI local para deployar edge functions (Miguel tiene que setup)
- Decisión sobre k-anonymity threshold (spec menciona ≥100)

### Riesgo
Edge functions de Supabase agregan latencia. Si el client espera la confirmación de pulse antes de renderizar resultado, mata UX. Mitigation: fire-and-forget desde el client (no await), aceptar pérdida ocasional de eventos.

---

## Plan 4c · Tratos Patrocinados (B2B layer)

**Spec ref**: sección 4

### Goal
Permitir que una marca patrocine un trato y los users que lo cumplan reciban una recompensa digital (cupón, código, etc.).

### Tareas previstas
- T1 · Verificar tablas `core.sponsored_tratos`, `core.brand_partners`, `core.reward_codes` (creadas en Plan 1, falta UI)
- T2 · Admin route `/admin/sponsored` (auth-gated a Miguel) para CRUD de sponsored_tratos
- T3 · Banner en home cuando hay sponsored_tratos activos
- T4 · Flow de "aceptar trato patrocinado" (one-tap, escoger dúo existente o invitar)
- T5 · Distribución de reward_code al cierre con resolución positiva
- T6 · Métrica de tracking: cuántos tratos cumplidos por sponsor

### Dependencia operacional
**1 marca firmada** antes de buildear UI completa. Spec sec 8 dice "Tratos Patrocinados puede partir como P2 si en semana 10 no hay marca firmada".

### Riesgo
Sin firma de marca, esta es deuda especulativa. Priorizar **outreach pre-launch** (spec sec 4.4) antes de code.

---

## Plan 4d · Email transactional

**Spec ref**: sección 7.4

### Goal
Mandar emails clave automáticos:
1. Invite (cuando creator crea trato, mandar al partner_email un email con el link)
2. Bienvenida (post sign-up)
3. Recordatorio diario de check-in (opt-in)
4. Trato cerrado (notificar resultado)

### Tareas previstas
- T1 · Resend account + domain verification (dovo.mx o dovo.vercel.app subdomain)
- T2 · React Email templates en `emails/` (Resend best practice)
- T3 · `lib/email.ts` wrapper con `sendEmail` que selecciona template
- T4 · Hook en `createTrato` que dispara email de invite
- T5 · Hook en `resolveTrato` que dispara email de cierre
- T6 · Edge function o cron para recordatorios diarios (parte de Plan 4b infra)

### Dependencia
- Cuenta Resend con API key (~$0 free tier hasta 3k emails/mes)
- Dominio dovo.mx o subdomain registrado en Vercel/Cloudflare
- DNS records (DKIM, SPF, DMARC) configurados

### Riesgo
Spam folder. Mitigation: domain auth (DKIM/SPF), warm-up gradual, plain-text companion. Resend tiene defaults sanos.

---

## Plan 4e · Push notifications

**Spec ref**: sección 7.4, 11.5

### Goal
PWA push notifications para recordatorios y eventos en tiempo real.

### Tareas previstas
- T1 · Service worker en `public/sw.js` con push event listener
- T2 · Web Push API setup (VAPID keys)
- T3 · `lib/push.ts` con subscribe/unsubscribe
- T4 · Tabla `core.push_subscriptions` (nueva)
- T5 · Cron / edge function que dispatch push events
- T6 · UI en `/ajustes` para opt-in/out de push

### Riesgo bloqueante
**iOS PWA push requiere iOS 16.4+ y Add-to-Home-Screen**. La adopción es baja. Spec sec 11.5 menciona backup plan: SMS via Twilio (~$0.30 MXN/SMS, presupuestar ~$5k MXN para los 200 users MVP).

### Dependencia
- VAPID keys generation
- HTTPS (Vercel ya cubre)
- iOS testing en device real (no simulator)

---

## Plan 4f · Legal · TOS + Privacy + Aviso de Privacidad

**Spec ref**: sección 5.5

### Goal
Páginas legales requeridas en MX:
1. **Términos de Servicio** (`/tos`)
2. **Aviso de Privacidad** integral (LFPDPPP) (`/privacidad`)
3. **Aviso de Cookies** si aplica

### Tareas previstas
- T1 · Borrador en docs/legal/ (Miguel + Claude colaboran en draft)
- T2 · Pasar a abogado MX para revisión (servicio externo, ~$5-15k MXN)
- T3 · Páginas Next renderizando markdown legal
- T4 · Aceptación al sign-up (checkbox)
- T5 · Versión histórica (cuando cambies TOS, los users firman v2)

### Lenguaje base
Spec sec 5.5 tiene borrador del texto de Pulse:
> "Para mejorar el producto agregamos datos anonimizados de uso a una capa estadística llamada Pulse. No leemos ni vendemos tu información individual."

### Riesgo
Sin TOS / Aviso, el launch tiene exposure legal LFPDPPP. Es bloqueante antes del soft launch a 50 dúos.

---

## Plan 4g · Onboarding (Pantalla 01)

**Spec ref**: 3.3 Pantalla 01

### Goal
3 pasos cuando un user nuevo entra primera vez:
1. Qué es dovo (1 párrafo + visual del mark)
2. Cómo funciona un dúo (cómo invitas)
3. Hacer el primer trato (CTA a /trato/new)

### Tareas previstas
- T1 · Route `/welcome` o modal sobre `/`
- T2 · Flag `core.users.onboarded_at` para no mostrar 2 veces
- T3 · 3 slides con animación
- T4 · Skip button

### Riesgo
Onboarding mal hecho fricción. Spec MVP es bueno pero el actual home con "todavía no hay tratos · hacer un trato →" puede ser suficiente. Considerar A/B antes de buildear.

---

## Plan 4h · Cleanup

### Items housekeeping pendientes (no urgentes, no bloqueantes)

1. **Rotar service_role JWT** — Miguel pegó el JWT en chat en sesiones previas. Acción manual en Supabase Dashboard → Settings → API → Reset service_role.
2. **Limpiar Vercel env vars legacy** — `ANTHROPIC_API_KEY`, `CRON_SECRET`, `SECRET_LINK_SLUG`, `APP_PIN` del proyecto mikeAndy ya no se usan. Borrar del Vercel dashboard.
3. **Limpiar legacy mikeAndy schema en `public.*`** — tablas zombie del proyecto previo. Hacer `drop table` selectivo en migration. Requiere confirmación de Miguel.
4. **Eliminar mock partner Andy** — `auth.users` + `core.users` con id `6814f700-...` se creó solo para el smoke test del Plan 3. Considerar eliminar cuando Andy real haga sign-up.
5. **Tests integration**: actualmente skipean sin local Supabase. Setup CI con `supabase start` para correrlos automático en GitHub Actions.

---

## Orden recomendado

Si Miguel pregunta "qué sigue":

1. **Plan 4f legal** primero — bloquea launch público. Borrador puedo empezar yo, abogado pulir.
2. **Plan 4d email** segundo — el invite copiar/pegar manual es el biggest friction actual.
3. **Plan 4b edge pulse** tercero — completa el privacy architecture, importante antes del público real.
4. **Plan 4c sponsored** después — depende de outreach manual de Miguel a marcas.
5. **Plan 4e push** opcional — backup plan SMS funciona.
6. **Plan 4g onboarding** opcional — A/B test antes de buildear.

Cleanup (4h) en paralelo, no bloquea.
