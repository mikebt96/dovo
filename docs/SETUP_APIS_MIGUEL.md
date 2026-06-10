# Configuración de APIs — pendientes para Miguel

> Lo que pediste "dejar para el final": las configuraciones de plataformas que requieren
> tus credenciales/cuentas. **El demo para inversionistas YA funciona sin nada de esto.**
> Fecha: 2026-06-07.

---

## ✅ Lo que YA quedó listo (no necesitas tocar)

- **Migración Fase B+C aplicada a prod** (`chyudsvjllcxdjgjafjo`): leaderboard de dúos,
  retos dúo-vs-dúo, boosts intra-dúo, showcase público. Idempotente, en el repo
  (`supabase/migrations/20260607120000_*.sql`).
- **Datos demo sembrados** en prod: 12 dúos, 25 perfiles, leaderboard vivo, 3 retos
  (2 activos + 1 cerrado), 2 boosts. La tabla luce poblada y creíble.
- **Seguridad verificada**: RLS intacto; `anon` solo puede leer agregados
  (`leaderboard_demo`); `core.users` / `user_perfil_fisico` → *permission denied* para anon.
  `is_demo` solo lo escribe service_role. Advisors de seguridad = 0 ERROR.
- **Build verde + typecheck limpio.** Tests verdes.
- **Cuenta demo lista** (sin OAuth, sin SMTP): `demo+ivan@dovofit.com` / `dovodemo2026`.

### Acceso demo para inversionistas (funciona HOY)
- **Showcase público** (sin login): `https://<tu-dominio>/showcase` — leaderboard + tarjetas.
- **Recorrido autenticado**: botón **"Ver demo"** (en landing, showcase y sign-in) → entra
  como Iván (dúo "Híbridos", #4 del leaderboard, con reto activo y boost recibido).

---

## 🔧 Lo que TÚ debes ejecutar (config de plataformas)

Ordenado por impacto. Nada de esto bloquea el demo; es para abrir a usuarios reales.

### 1. Google OAuth — para signup real con Google
- Google Cloud Console → APIs & Services → Credentials → crear **OAuth Client ID** (Web).
  - Authorized redirect URI: `https://chyudsvjllcxdjgjafjo.supabase.co/auth/v1/callback`
- Supabase → Authentication → Providers → **Google** → habilitar + pegar Client ID y Secret.
- *(El demo no lo usa; esto desbloquea el botón "continuar con Google" para usuarios reales.)*

### 2. Email / Resend — magic link + resumen mensual
- Crear cuenta en **Resend** → API key. Verificar el dominio `dovofit.com` (SPF/DKIM).
- Supabase → Edge Functions → `monthly-summary` → **Secrets**:
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL = "dovo <hola@dovofit.com>"`.
- Vercel → Project → Settings → Environment Variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
  (para `lib/email`).
- *(Opcional pero recomendado)* Supabase → Auth → **SMTP propio** con Resend — el SMTP
  default de Supabase entrega ~2-3 emails/h, insuficiente para testers reales.

### 3. Supabase Auth — URL configuration
- Supabase → Authentication → URL Configuration:
  - **Site URL**: `https://dovofit.com`
  - **Redirect URLs**: `https://dovofit.com/auth/callback` (+ la URL actual de Vercel).

### 4. Dominio dovofit.com
- Vercel → Project → Domains → agregar `dovofit.com` (+ apuntar DNS según Vercel).
- Vercel → Env: `NEXT_PUBLIC_APP_URL = https://dovofit.com`.

### 5. (Opcional) Leaked-password protection
- Supabase → Auth → Password → habilitar protección contra contraseñas filtradas
  (HaveIBeenPwned) cuando abras signups reales.

### 6. (Deuda técnica, no urgente) Proyecto Supabase propio
- Hoy dovo comparte la misma BD Postgres con otro producto (KASA/nutrición) en el schema
  `public.*`. dovo vive 100% en `core.*` (aislado), pero mover dovo a su propio proyecto
  Supabase elimina confusión a futuro.

### 7. Stripe — pagos (F7) · SANDBOX-FIRST

Hoy la app corre en **modo sandbox**: `/suscripcion` se ve completa, pero "Hazte Pro" abre
**"próximamente · te avisamos"** (no un Checkout roto), los gates Pro muestran *preview*, y el
dúo demo se ve como **Pro** para el recorrido del inversionista. **Nada se rompe sin keys.**
Para encender el cobro real:

**a) Dashboard de Stripe** (haz Test primero, luego repite en Live):
1. **Products** → crea **dovo Pro** con 2 precios recurrentes en **MXN**: **$139/mes** y **$1,290/año**.
2. **Products** → crea **dovo Premium**: **$229/mes** y **$2,190/año**.
3. Copia los **4 Price IDs** (`price_…`).
4. **Developers → API keys** → copia la **Secret key** (`sk_live_…` / `sk_test_…`).
5. **Developers → Webhooks → Add endpoint**:
   - URL: `https://dovofit.com/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copia el **Signing secret** (`whsec_…`).
6. *(Recomendado)* **Billing → Customer portal** → actívalo (para el botón "gestionar suscripción").

**b) Vercel → Settings → Environment Variables (Production)** y **Redeploy**:
```
BILLING_ENABLED=true
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_PRO_MONTHLY=price_…
STRIPE_PRICE_PRO_YEARLY=price_…
STRIPE_PRICE_PREMIUM_MONTHLY=price_…
STRIPE_PRICE_PREMIUM_YEARLY=price_…
```
Con eso: el Checkout cobra de verdad, el webhook actualiza el tier del dúo y los gates Pro
empiezan a aplicar. Probar local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
+ `stripe trigger checkout.session.completed`.

> **Regla del dúo:** la suscripción es **del dúo** (`core.subscriptions`, 1 row por `trato_id`).
> Cualquiera de los dos paga y **ambos** desbloquean. Si uno cancela, el webhook baja el tier.
> Registrar una feature Pro nueva = 1 línea en `lib/billing/tiers.ts` (`FEATURE_TIERS`).

### 8. Claude API — nutrición IA (F5) · SANDBOX-FIRST

Hoy `/nutricion` funciona completa **sin key**: plan semanal **base** determinista (platillos
mexicanos reales + macros por fórmula desde el BMR del usuario), lista del súper y logging
diario. El botón de IA muestra "IA próximamente". **Nada se rompe sin key.** Para encender
la personalización real:

**a) Consola de Anthropic** (https://console.anthropic.com):
1. Crea una **API key** (Settings → API keys).
2. Pon un **límite de gasto mensual** (Settings → Limits) — recomendado al inicio: $10-20 USD.

**b) Vercel → Settings → Environment Variables (Production)** y **Redeploy**:
```
NUTRITION_AI_LIVE=true
ANTHROPIC_API_KEY=sk-ant-…
NUTRITION_MODEL=claude-opus-4-6        # opcional; default claude-opus-4-6
```
Con eso: el botón "personalizar con IA" regenera el plan de la semana con Claude
(respeta restricciones/presupuesto/preferencias del perfil). La generación es **semanal y
cacheada** (1 llamada por usuario por semana como máximo, vía botón) — control de costo.

> **Costo estimado** (1 plan/semana/usuario): con `claude-opus-4-6` ≈ $1.0-1.5 USD/mes/usuario
> (≈ $2-3/dúo). Si el COGS aprieta, cambia `NUTRITION_MODEL=claude-haiku-4-5` (≈ $0.05-0.10
> /mes/usuario) **sin tocar código** — solo esa env var. El plan base (sin IA) cuesta $0.
> La misma `ANTHROPIC_API_KEY` servirá para F6 (análisis corporal con Vision) — una sola key.

### 9. Push notifications (F8) · VAPID self-served — NO necesitas cuenta de terceros

La infra ya está en vivo: service worker, suscripción por device, preferencias por usuario
(en /ajustes → avisos) y 3 triggers conectados (compañero entrenó · reto recibido · reto
aceptado). Sin keys el envío es no-op y la UI dice "avisos próximamente". Para encender:

1. En tu terminal del repo: `node scripts/gen-vapid.mjs` (o pídeme las keys — las genero yo).
2. Pega la salida (3 líneas) en **Vercel → Environment Variables (Production)** y Redeploy:
```
VAPID_PUBLIC_KEY=…
VAPID_PRIVATE_KEY=…
VAPID_SUBJECT=mailto:hola@dovofit.com
```
> Plataformas: Android/desktop completo. iPhone: requiere agregar dovo a pantalla de inicio
> (iOS 16.4+) — la UI ya se lo explica al usuario.

### 10. dovo como APP (Apple / Android) · estrategia por fases

**Fase 1 — PWA instalable (YA en vivo, $0):** manifest completo + service worker. En Android
Chrome ofrece "Instalar app" (WebAPK con icono y splash); en iOS "Agregar a inicio". Funciona
hoy sin que hagas nada.

**Fase 2 — Google Play (cuando quieras estar en la tienda):**
- Compra: cuenta **Google Play Console** ($25 USD una sola vez) → play.google.com/console
- La app se empaqueta como **TWA** (Trusted Web Activity) con Bubblewrap — yo la genero del
  manifest existente; tú solo subes el .aab y llenas la ficha. Sin código nuevo.

**Fase 3 — App Store (Apple):**
- Compra: **Apple Developer Program** ($99 USD/año) → developer.apple.com
- Apple no acepta PWA "wrappeada" sin más: la ruta es **Capacitor** (mismo código web en un
  shell nativo + push nativo APNs). Es un proyecto de empaquetado que hago cuando tengas la
  cuenta; el producto web no cambia.

> Orden recomendado: valida con la PWA (Fase 1, ya está) → Play Store con tracción → App Store
> al final (es el mayor costo/fricción y el mismo producto).

---

## 🔄 Mantener el demo fresco (importante)

Los datos demo se siembran en la **semana actual** (para que el leaderboard "semana" salga
poblado). Si pasan semanas, el leaderboard semanal se vaciaría. Para refrescar:

```bash
cd ~/dovo
npx tsx scripts/gen-seed-sql.ts      # regenera scripts/seed-demo.sql (idempotente)
# luego aplicar scripts/seed-demo.sql a prod (vía Supabase SQL editor o psql)
```

> Puedo dejarte un **cron semanal** que re-siembre automáticamente — pídemelo y lo configuro.

---

## 💰 Pricing (decidido por el consejo de finanzas/marketing/ventas)

Ver `docs/investor/2026-06-07-pricing-gtm.md` para el detalle. Resumen:
- **Free** (primeros 200 dúos = "Fundadores") · **Pro $139 MXN/mes/dúo** ($1,290/año, ~$70 por
  persona) · **Premium $229/mes**. Freemium permanente + paywall contextual (sin trial de tiempo).
- Los precios de la landing y de `/suscripcion` ya reflejan esto. **F7 (Stripe Checkout +
  gating) ya está construido en modo sandbox** — ver §7 arriba para encenderlo con tus keys.
