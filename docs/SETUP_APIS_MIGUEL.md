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
- Los precios de la landing ya reflejan esto. Stripe Checkout es trabajo futuro (F7 del spec).
