# dovo en las tiendas — guía de empaquetado (Apple + Android)

> El producto **ya es una PWA instalable** (manifest + service worker en vivo). Esta guía es
> para cuando quieras estar en **Google Play** y **App Store** con el MISMO código web —
> sin reescribir nada. Orden recomendado: PWA (ya) → Play Store (con tracción) → App Store.

---

## Fase 1 — PWA instalable · YA EN VIVO ($0, cero trabajo)

- **Android (Chrome):** al entrar a dovofit.com aparece "Instalar app" → WebAPK con icono,
  splash y standalone. Indistinguible de una app nativa para el 95% de los casos.
- **iPhone (Safari):** Compartir → "Agregar a inicio". La UI ya se lo explica al usuario en
  el flujo de notificaciones (push iOS requiere esto + iOS 16.4+).

Esto cubre tu lanzamiento. Las fases 2-3 son para *distribución en tiendas* (descubrimiento,
confianza, reviews), no para que la app "funcione".

---

## Fase 2 — Google Play (TWA) · ~1 hora + $25 USD una vez

**TWA (Trusted Web Activity)** = tu PWA dentro de un contenedor Android que Google firma. No
es un WebView de juguete: corre Chrome real, full-screen, con tu dominio verificado.

### Pasos
1. **Cuenta:** play.google.com/console → registro de desarrollador ($25 pago único).
2. **Genera el proyecto Android** con Bubblewrap (yo lo corro; tú solo necesitas el output):
   ```bash
   npx @bubblewrap/cli init --manifest https://dovofit.com/manifest.webmanifest
   npx @bubblewrap/cli build       # produce app-release-signed.aab + assetlinks.json
   ```
3. **Verifica el dominio (Digital Asset Links):** **ya dejé el archivo listo** en
   `public/.well-known/assetlinks.json` (se sirve en `https://dovofit.com/.well-known/assetlinks.json`).
   Solo reemplaza `REEMPLAZA_CON_EL_SHA256_DE_TU_LLAVE_DE_FIRMA` por el SHA-256 que Bubblewrap
   imprime al firmar (y `com.dovofit.app` si cambias el package). Commit + push → verificado.
4. **Sube el `.aab`** a Play Console, llena la ficha (descripción, screenshots, ícono 512,
   feature graphic 1024×500) y manda a revisión. Aprobación típica: 1-3 días.

> Notas: la TWA usa el MISMO sitio en vivo — cada deploy a Vercel actualiza la app sin
> resubir a Play. Push funciona (FCM vía el navegador). Pagos: Stripe web funciona, pero si
> algún día vendes "contenido digital" puro, Google podría exigir su billing (la suscripción
> de dovo es a un servicio multiplataforma → normalmente exenta; consultar al publicar).

---

## Fase 3 — App Store (Capacitor) · ~medio día + $99 USD/año

Apple **no** acepta una PWA "envuelta" sin más; pide una app real. **Capacitor** (de Ionic)
mete tu sitio web en un shell nativo iOS con APIs nativas (push APNs, cámara nativa para F6,
biometría, etc.) — sigue siendo tu mismo código web.

### Pasos (los corro yo cuando tengas la cuenta)
1. **Cuenta:** developer.apple.com → Apple Developer Program ($99/año).
2. **Añade Capacitor al repo** (no rompe la web):
   ```bash
   npm i @capacitor/core @capacitor/ios && npx cap init dovo com.dovofit.app
   npx cap add ios && npx cap copy ios
   ```
   La config apunta `server.url = https://dovofit.com` (carga el sitio en vivo) o empaqueta
   un build estático — decidimos según si quieres updates OTA sin pasar por review.
3. **Push nativo (APNs):** subes una *APNs Auth Key* (.p8) desde tu cuenta Apple; yo cableo
   `@capacitor/push-notifications` al mismo backend de F8 (el endpoint cambia de Web Push a
   APNs token; la tabla `push_subscriptions` ya está lista para guardar ambos).
4. **Build + TestFlight** desde Xcode (necesitas una Mac, o un runner cloud tipo Codemagic).
5. **Envía a App Review.** Aprobación típica: 1-3 días. Apple es más estricta — la guía de
   privacidad de F6 (foto borrada en 60s, doble consentimiento) ya cumple sus reglas de
   datos sensibles; el disclaimer "no es consejo médico" evita la categoría salud regulada.

---

## Qué cambia en el código por plataforma (resumen)

| Capacidad | PWA / Android (TWA) | iOS (Capacitor) |
|---|---|---|
| Render | sitio en vivo (Vercel) | sitio en vivo o build empaquetado |
| Push | Web Push (VAPID, F8) ✓ | APNs (token nativo → mismo backend) |
| Foto F6 | input file / cámara web ✓ | cámara nativa (mejor UX) |
| Pagos | Stripe web ✓ | Stripe web ✓ (revisar reglas Apple por tier) |
| Updates | instantáneo (cada deploy) | instantáneo si `server.url`; review si empaquetado |

**Lo importante:** una sola base de código (este repo) alimenta web + Android + iOS. No hay
fork nativo que mantener. El 90% del trabajo de tiendas es *cuentas + fichas + assets*, no
código — y los assets (íconos) ya se generan con `scripts/gen-icons.mjs`.
