# Plan 4d · Email transactional (Resend)

**Fecha**: 2026-05-19
**Predecesor**: v0.4f-legal
**Spec ref**: sección 7.4, 8 (semana 9)

---

## Contexto

Actualmente, cuando Miguel crea un trato, copia el invite link y lo manda por WhatsApp manualmente. Eso es OK para MVP cero, pero para escalar a los 200 users free necesitamos email automático del invite + notificación al cierre.

Resend es el proveedor estándar para Next.js/Vercel: free tier de 3k emails/mes (suficiente para 200 users × ~10 emails/user/mes), DKIM/SPF auto-config, deliverability buena.

## Decisiones

### D1 · Fail-soft sin RESEND_API_KEY

Si la env var no está seteada, las acciones de creación/cierre **siguen funcionando**. Solo se loggea un warning y el email se omite. Esto desacopla el shipping del code del setup de Resend en Vercel.

Cuando Miguel agregue la API key en Vercel, los emails arrancan automáticamente. No requiere redeploy del código.

### D2 · Fire-and-forget desde el server action

El envío de email NO bloquea la respuesta del server action al usuario. Si Resend tarda 3s, el user vería esos 3s en el spinner — inaceptable. Hacemos `sendEmail(...).catch(() => {})` sin await.

Trade-off: si Resend falla, el user no se entera (no hay retry). Para MVP, aceptable.

### D3 · Plain HTML templates (no React Email)

React Email es la convención pero agrega 30+ deps y un build step. Para MVP con 3 templates simples (invite, accepted, closed), strings de HTML con escape de variables son suficientes.

Cuando los templates crezcan en complejidad (Año 2), migrar a `@react-email/components`.

### D4 · From domain

`hola@dovo.app` como remitente único (no alias por tipo). Más simple de verificar en Resend (un solo DKIM record).

TODO Miguel: agregar DNS records (DKIM, SPF, DMARC) en su provider de dovo.app antes de que los emails dejen de ir a spam.

### D5 · Sin reply tracking

`Reply-To: hola@dovo.app`. No webhooks de Resend para tracking de opens/clicks en MVP. Privacy-friendly y simple.

---

## Tareas

### T1 · `npm install resend`

Agregar dep + actualizar package-lock.

### T2 · `lib/env.ts` opcional RESEND_API_KEY

Agregar `RESEND_API_KEY: z.string().optional()` al Zod schema de env. Si falta, no truena el build.

### T3 · `lib/email.ts` — wrapper sendEmail

```typescript
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }>;
```

Si `RESEND_API_KEY` falta, log + return `{ ok: false, skipped: true }`. Si existe, llama Resend SDK + return con id. Capturas errores y loggea.

### T4 · `lib/email/templates/`

Tres templates como funciones puras `(data) => { subject, html, text }`:
- `invite.ts` — al partner_email cuando se crea un trato (link + creator name)
- `accepted.ts` — al creator cuando el partner acepta (CTA a la trato page)
- `closed.ts` — a ambos cuando el trato cierra (resultado + link)

### T5 · Hook en `createTrato` action

Después del INSERT exitoso, dispara `sendEmail(invite, ...)` fire-and-forget.

### T6 · Hook en `acceptTrato` action

Después del UPDATE exitoso a `activo`, dispara `sendEmail(accepted, ...)` al creator.

### T7 · Hook en `resolveTrato` action

Después del UPDATE a `cerrado`, dispara `sendEmail(closed, ...)` a ambos miembros (mismo template, distinto "tú cumpliste/fallaste").

### T8 · `.env.example` actualizado

Agregar `# RESEND_API_KEY=re_xxx` comentado con instrucciones.

### T9 · Build + commit + tag v0.4d-email

---

## TODO Miguel (post-merge)

1. Crear cuenta en `https://resend.com` (free tier)
2. Verificar dominio `dovo.app`:
   - Agregar DNS records (Resend te los da: DKIM TXT, MX, SPF TXT, opcional DMARC)
   - Espera ~10 min a que propaguen
3. Generar API key en Resend dashboard
4. En Vercel: agregar env var `RESEND_API_KEY=re_xxx` para production
5. Trigger un redeploy (o esperar al siguiente push)
6. Test: crear un trato con partner_email tuyo → verificar email llegó

Si dovo.app no está registrado todavía, alternativa interim: usar `dovo.vercel.app` (Resend permite verificar subdomains de Vercel con un TXT record).

---

## Out of scope (futuras iteraciones)

- Recordatorios diarios de check-in (requiere cron/edge function — Plan 4e o 4b)
- Email de bienvenida post sign-up (low value, agregar después si churn lo justifica)
- Template de "tu trato expira en 1 día" (idem)
- Resend webhooks para tracking de delivery (privacy concern, mejor sin)
- Opt-out de emails granular (por ahora, opt-out general vía pulse_opt_out o cancelación de cuenta)
- React Email components migration (Año 2)
