<!-- Consejo de compliance, research en vivo 2026-06-17. Reglas de tienda cambian: re-verificar antes de cada submit. -->

# Compliance App Store + Play — dovo

## 1. Veredicto: ¿el borrado de cuenta actual (tombstone) es suficiente? (sí/no + por qué)

**SÍ, la arquitectura tombstone es suficiente — NO migres a CASCADE ni a hard-delete físico — PERO solo si se cumplen 4 condiciones, y hoy hay UN HUECO probable.**

Por qué la arquitectura sirve (regla citada):
- **Apple** no exige `DELETE` SQL de la fila. Exige eliminar el *"entire account record, along with associated personal data"* y lo único que prohíbe explícitamente es *"only offering to temporarily deactivate or disable an account is insufficient."* No menciona ni prohíbe "anonimización". Un tombstone que **purga toda la PII** y deja solo registros no-personales o legalmente requeridos cumple el espíritu de la regla (el registro queda sin dueño re-identificable).
- **Google** es más estricto en texto (*"you must also delete the user data"*), pero el propio Data Safety form acepta como mecanismo válido *"deletion or anonymization of collected data within 90 days"* → Google trata **anonimización ≡ borrado**.

Las 4 condiciones (las 3 primeras probablemente ya las cumples; la #2 es el hueco a verificar):
1. **PII purgada de verdad** en tablas de perfil/negocio (nombre, email, teléfono, fotos, salud → NULL/anonimizado). Un flag `is_deleted=true` con datos intactos = "deactivation" = RECHAZO Apple. → Tu RPC `core.cancelar_cuenta()` ya borra salud/nutrición/juego/membresías. ✅ probable.
2. **El registro de AUTH (`auth.users`) también se anonimiza/borra.** Dejar `auth.users` con email/teléfono real = INCUMPLE (el email en `auth.users` ES PII y la cuenta sigue siendo reactivable vía login). → **VERIFICAR**: tu descripción dice que la action "banea+anonimiza el login en auth.users (admin API)". Si "anonimiza" significa que ofusca email+phone (patrón Supabase: SHA256+salt, vacía `identity_data`, hashea `provider_id`, mata MFA/sesiones, **preserva el UUID** para tus FK RESTRICT), entonces ✅ y es EXACTAMENTE el patrón correcto para FKs RESTRICT. Si solo pone un flag de ban dejando el email visible → ❌ hay que arreglarlo.
3. **Sesión invalidada de inmediato** (revocar refresh tokens; el JWT vivo sobrevive hasta expirar — gotcha conocido de Supabase). → **VERIFICAR** que la action revoque sesiones, no solo banee.
4. **Retención solo de lo legal/fraude/disociado, documentada** en el aviso de privacidad y en la página web de borrado (qué se queda, por qué, cuánto). Tus tratos/retos/apuestas (`created_by` ON DELETE RESTRICT) y agregados disociados con k-mínimo caen aquí. → **FALTA**: declararlo explícito en /privacidad.

**Conclusión:** Mantén FKs RESTRICT + UUID + soft-delete de auth + purga de PII (patrón nativo de Supabase Auth, diseñado justo para tu caso). NO migres a CASCADE: borrarías registros que otros roomies/dúos comparten, que es justo lo que las FK protegen. Acción inmediata: confirmar #2 y #3 en la action de la web, y documentar #4.

---

## 2. App Store — checklist

Formato: requisito → estado en dovo → qué falta → quién lo hace.

| # | Requisito (guideline) | Estado en dovo | Qué falta | Quién |
|---|---|---|---|---|
| A1 | **Borrado in-app** obligatorio (5.1.1/v). Borrado total, no desactivar. Link in-app si se completa en web. | Implementado en web (Ajustes, doble confirmación). | Replicar el botón en la app nativa iOS; si el borrado se completa en web, incluir link in-app directo a la página. Verificar condiciones #2/#3 del punto 1. | Código (nativo iOS) |
| A2 | **Avisar qué datos se retienen por ley** al borrar (LFPDPPP/SABG). | Parcial — la lógica retiene tombstone pero no se comunica. | Sección en /privacidad: qué se conserva (registros disociados compartidos, fiscal), por qué, cuánto. | Miguel + Código (texto) |
| A3 | **Sign in with Apple** si hay social login (4.8). Ver punto 4. | dovo tiene Google → DISPARADO. | Construir Sign in with Apple nativo (o quitar Google). Es feature nativa. | Código (nativo iOS) |
| A4 | **HealthKit usage strings** (`NSHealthShareUsageDescription`, +Update si escribes). Sin la string la app **CRASHEA**, no solo rechazo. | Pendiente (HealthKit es futuro). | Añadir las strings al Info.plist cuando se integre HealthKit. Ver punto 5. | Código (nativo iOS) |
| A5 | **HealthKit anti-ads / anti-venta / anti-iCloud** (5.1.3). | Cumplido por diseño (salud owner-only, jamás a Pulse/ads/venta). | Mantener; no declarar Health bajo propósitos de advertising en la label. | Ya cumplido |
| A6 | **Privacy policy: URL en App Store Connect + in-app** (5.1.1/i). Debe cubrir retención/borrado y cómo revocar consentimiento. | Aviso v1.0 vigente en /privacidad. | Pegar URL en App Store Connect; enlazar in-app accesible; añadir sección retención/borrado/revocación (cruza con A2). Completar domicilio fiscal. | Miguel (consola) + Código |
| A7 | **App Privacy label** en App Store Connect. | Pendiente (no enviado aún). | Llenar la nutrition label. Texto exacto en punto 6. | Miguel (consola) |
| A8 | **ATT** solo si trackeas cross-company. | dovo NO trackea. | NO incluir framework ATT ni prompt. Marcar "Data Not Used to Track You". | Miguel (consola) |
| A9 | Sin teléfono/email forzado para borrar (no industria regulada). | OK (botón in-app). | Nada. | Ya cumplido |

---

## 3. Google Play — checklist

| # | Requisito | Estado en dovo | Qué falta | Quién |
|---|---|---|---|---|
| G1 | **Borrado: AMBAS rutas.** In-app (ajustes, "intuitive and prominent") **Y** URL web pública que funcione **sin reinstalar la app**. | In-app existe en web; falta la nativa Android. **La URL web pública de borrado NO existe como tal.** | Construir la página web de borrado (ver abajo). Replicar botón in-app en Android nativo. | Código (web + nativo) |
| G2 | La URL web puede **solicitar** borrado (form/email/OTP), no exige borrado automático instantáneo. **Puede exigir verificación de identidad (incl. login)** — lo prohibido es fricción que no sea verificación ("no intermediate 'Sign In First' unless required for verification"). | No existe. | **Recomendado: patrón email + OTP** (usuario mete email → recibe código → confirma borrado). Es más robusto que login puro porque quien desinstaló pudo olvidar la contraseña. Login puro también es válido pero deja fuera ese caso. La página debe nombrar la app/dev y especificar *"types of data that are deleted or kept, and any additional retention period."* | Código (web) |
| G3 | **Dónde se declaran ambas rutas:** en el **Data safety form → App content → "Data deletion questions"** (NO formulario aparte). | Pendiente. | Declarar: ofrece borrado in-app = sí; URL web de borrado = `https://dovofit.com/borrar-cuenta` (o la que se cree). | Miguel (consola) |
| G4 | **Data safety form** completo: recolección/compartición (incl. SDKs de terceros), tipos (incl. health data), encryption in transit, mecanismo de borrado. | Pendiente. | Llenar. Texto exacto en punto 6. Privacy policy URL pública no-PDF, no geo-bloqueada, enlazada en Console + in-app. | Miguel (consola) |
| G5 | **Health Connect: `PermissionsRationaleActivity` + `activity-alias ViewPermissionUsageActivity`** en el manifest, apuntando a la MISMA privacy policy del Console. | Pendiente (Health Connect es futuro). | Añadir al manifest cuando se integre. Snippet exacto en punto 5. | Código (nativo Android) |
| G6 | **Health apps declaration form** (App content), justificación por cada data type. Acceso restringido a apps con beneficio claro al usuario. | Pendiente. | Llenar al integrar Health Connect, justificando cada permiso. | Miguel (consola) |
| G7 | **Health Connect: cero ads / cero venta** de datos de salud; compartir solo con consentimiento explícito. Update 2026: prohibido usar health data para empleo/seguros o compartición social no autorizada. | Cumplido por diseño. | Mantener. | Ya cumplido |
| G8 | **Prominent disclosure in-app** justo ANTES de pedir cualquier permiso sensible (Why/What/How), con opción de declinar. **NO puede estar en la descripción de Play ni en web** — solo in-app. Nivel de lectura de 13 años. | Pendiente. | Pantalla nativa pre-permiso (Health Connect, location si aplica). No sustituye privacy policy ni Data Safety. | Código (nativo Android) |
| G9 | **Target API 35 (Android 15) o superior** para subir/actualizar (efectivo 31-ago-2025). | Fase 0 — a definir en build. | Compilar contra API 35+. (Wear OS/TV = API 34+, no aplica salvo que hagas Wear OS.) | Código (nativo Android) |

---

## 4. Sign in with Apple — ¿obligatorio para dovo?

**SÍ, obligatorio. Es feature nativa a construir en iOS.**

Regla 4.8 "Login Services" (verbatim, el disparador):
> "Apps that use a third-party or social login service (such as Facebook Login, **Google Sign-In**, ...) to set up or authenticate the user's primary account with the app must also offer as an equivalent option another login service with the following features: [1] limits data collection to name and email; [2] allows users to keep their email address private; and [3] does not collect interactions with your app for advertising purposes without consent."

dovo ofrece **Google Sign-In** → 4.8 disparado.

La excepción que podría salvarte NO aplica:
> "Another login service is not required if: Your app **exclusively** uses your company's own account setup and sign-in systems."

La palabra clave es **exclusively**. Tu **magic link first-party NO te exenta** mientras Google esté presente, porque al ofrecer Google dejas de usar *exclusivamente* tu sistema propio. Y un magic link de email típico **no cumple la feature [2]** ("mantener el email privado") — el usuario te entrega su email real. Por eso el camino limpio es **Sign in with Apple** (cumple las 3, incluyendo Hide My Email).

**Decisión:**
- **Camino A (recomendado): añadir Sign in with Apple nativo en iOS.** Mantienes Google. Al implementarlo, recuerda: al borrar la cuenta debes **revocar el token vía Sign in with Apple REST API** (*"use the Sign in with Apple REST API to revoke user tokens"*) — esto se conecta con tu RPC de borrado.
- **Camino B (evita 4.8 por completo): quitar Google de iOS y dejar SOLO el magic link propio** → caes en la excepción "exclusively uses your company's own account setup". Pero en cuanto vuelvas a meter Google, la obligación regresa. Menos trabajo de auth, peor conversión de login.

*Nota:* 4.8 es regla de **Apple**. Google Play NO exige el equivalente, así que en Android puedes mantener Google + magic link sin Sign in with Apple.

---

## 5. Datos de salud — requisitos exactos

### iOS — HealthKit (Info.plist), textual

dovo **lee** HealthKit → `NSHealthShareUsageDescription` **OBLIGATORIO**. Si además **escribes** (peso/entrenos) → también `NSHealthUpdateUsageDescription`. Sin la string, *"your app exits"* (crash en runtime, no solo rechazo).

Las strings deben describir el uso real, no genéricos ("la app necesita acceso" → rechazo). Textos sugeridos (ajustar al copy de dovo):

```xml
<key>NSHealthShareUsageDescription</key>
<string>dovo lee tus pasos, entrenamientos y frecuencia cardiaca para mostrar tu progreso y el de tu dúo. Estos datos son solo tuyos: nunca se comparten con anunciantes ni se venden.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>dovo guarda los entrenamientos y el peso que registras para mantener tu historial de salud sincronizado. Solo tú accedes a estos datos.</string>
```

Reglas 5.1.3 a respetar: nada de health data para ads/marketing/data-mining; **no almacenar PHI en iCloud**; declarar los datos de salud específicos.

### Android — Health Connect (manifest), textual

`PermissionsRationaleActivity` es **OBLIGATORIA**; debe mostrar **la misma privacy policy** del Play Console. Manifest exacto (Android 14+ usa el activity-alias):

```xml
<activity
    android:name=".PermissionsRationaleActivity"
    android:exported="true">
  <intent-filter>
    <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
  </intent-filter>
</activity>

<activity-alias
    android:name="ViewPermissionUsageActivity"
    android:exported="true"
    android:targetActivity=".PermissionsRationaleActivity"
    android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
  <intent-filter>
    <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
    <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
  </intent-filter>
</activity-alias>
```

### Declaraciones de consola (salud)
- **iOS:** en App Privacy label declarar **Health & Fitness** bajo propósito App Functionality (NUNCA bajo advertising). Ver punto 6.
- **Android:** **Health apps declaration form** (App content) — indicar features de salud y **justificación clara por cada data type** solicitado; acceso restringido a beneficio claro al usuario.

*Caveat (no verificado en los reportes):* el Update 2026 de Google mete tipos de alta sensibilidad (Menstrual Cycle Phases, Alcohol, Symptoms) bajo permisos granulares en Android 16. dovo (fitness) probablemente no los toca, pero si algún día añades ciclo menstrual o síntomas, revisa answer/16926792 antes.

---

## 6. Texto exacto para los formularios de consola

### A) App Store Connect — App Privacy label

Para cada tipo: marcar si se recolecta, si se enlaza al usuario (Linked), si se usa para tracking (No), y el/los propósitos.

| Data type (categoría Apple) | ¿Recolecta? | Linked al usuario | Tracking | Propósito a marcar |
|---|---|---|---|---|
| **Health** (Health & Fitness) | Sí (al integrar HealthKit) | Sí | **No** | App Functionality |
| **Fitness** (Health & Fitness) | Sí | Sí | **No** | App Functionality |
| **Email Address** (Contact Info) | Sí (magic link / login) | Sí | **No** | App Functionality |
| **User ID** (Identifiers) | Sí (UUID de cuenta) | Sí | **No** | App Functionality, (Analytics si aplica) |
| **Purchase History** (Purchases) | Sí (suscripción $139 MXN/dúo) | Sí | **No** | App Functionality |
| **Usage Data** (Product Interaction) | Sí, si registras analítica de uso | Sí/No según tu setup | **No** | Analytics, Product Personalization |
| **Diagnostics** (Crash/Perf) | Solo si usas crash reporting | No | **No** | App Functionality |

- Selección global: **"Data Not Used to Track You"** (no hay tracking cross-company).
- **Health/Fitness JAMÁS bajo "Developer's Advertising" ni "Third-Party Advertising"** — lo prohíbe 5.1.3(i) de raíz.
- Si un SDK de terceros (analytics, push) recolecta algo, también se declara — *"including ... libraries and/or SDKs ... irrespective of whether data is transmitted to you or a third-party server."*

### B) Google Play — Data Safety form

**Data collected / shared:**

| Tipo (categoría Google) | Collected | Shared | Encrypted in transit | Propósito |
|---|---|---|---|---|
| **Health info** (Health Connect) | Sí (al integrar) | **No** | Sí | App functionality |
| **Fitness info** | Sí | **No** | Sí | App functionality |
| **Email address** (Personal info) | Sí | No | Sí | Account management, App functionality |
| **User IDs** (Personal info) | Sí | No | Sí | App functionality, Analytics (si aplica) |
| **Purchase history** (Financial info) | Sí (suscripción) | No | Sí | App functionality |
| **App interactions** (App activity) | Sí, si registras analítica | No | Sí | Analytics, App functionality |
| **Crash logs / Diagnostics** | Solo si usas crash reporting | No | Sí | App functionality |

**Security practices:** marcar "Data is encrypted in transit" = Sí. "Users can request data deletion" = **Sí**.

**Data deletion questions (la sección que cierra el punto 3):**
- ¿La app ofrece ruta in-app para borrar la cuenta? → **Sí**.
- URL web de borrado → **`https://dovofit.com/borrar-cuenta`** (crear; ver G2).
- Mecanismo de retención (si aplica): declarar que se retienen registros disociados compartidos y datos legalmente requeridos (fiscal MX), e indicar el periodo.

**Privacy policy URL:** `https://dovofit.com/privacidad` (activa, pública, NO geo-bloqueada, **no PDF**).

> Recordatorio: la Data Safety section **complementa, no reemplaza** la privacy policy. La policy debe declarar comprehensivamente acceso/recolección/uso/compartición, sin limitarse a lo de la sección.

---

## 7. Lo que construyo yo ahora (web/BDD) vs lo nativo (por fase) vs lo que llena Miguel

### Ahora (web + BDD — Fase 0, antes de cualquier submit)
1. **Página web pública de borrado** `https://dovofit.com/borrar-cuenta` con patrón **email + OTP** (requisito DURO de Google; Apple lo recomienda). Debe funcionar sin reinstalar la app, nombrar la app/dev, y listar qué datos se borran vs se conservan.
2. **Verificar/arreglar la action de borrado** para confirmar las condiciones #2 y #3 del punto 1: que `auth.users` quede con email/phone ofuscados (no solo baneado) y que se **revoquen los refresh tokens** (no dejar JWT vivo). Patrón Supabase soft-delete: SHA256+salt en email/phone, vaciar `identity_data`, hashear `provider_id`, hard-delete de MFA/sesiones, preservar UUID.
3. **Sección de retención/borrado/revocación en `/privacidad`**: qué se conserva (tratos/retos/apuestas disociados por FK RESTRICT, agregados con k-mínimo, fiscal MX), por qué, cuánto, y cómo revocar consentimiento / pedir borrado.
4. Completar el **domicilio fiscal** que falta en el aviso.

### Nativo, por fase
- **iOS, antes de submit a App Store:** botón borrado in-app (+ link a web si se completa allá); **Sign in with Apple** (4.8) con revocación de token REST al borrar; `NSHealthShareUsageDescription` (+Update) cuando se integre HealthKit; no PHI a iCloud.
- **Android, antes de submit a Play:** botón borrado in-app; **target API 35+**; cuando se integre Health Connect → `PermissionsRationaleActivity` + `activity-alias` en manifest; **prominent disclosure** pre-permiso (Why/What/How, opción de declinar, lectura nivel 13 años).

### Lo que llena Miguel en consola
- **App Store Connect:** App Privacy label (tabla 6A); URL de privacy policy; NO activar ATT; metadata.
- **Play Console → App content:** Data Safety form (tabla 6B) incl. Data deletion questions con la URL de borrado; Health apps declaration form (al integrar Health Connect) con justificación por data type; URL de privacy policy.

---

## 8. Riesgos de rechazo y cómo evitarlos

1. **[Apple, alto] Borrado que "desactiva" en vez de borrar.** Si el reviewer ve que tras "borrar" el email sigue en `auth.users` o el login aún funciona → rechazo por 5.1.1/v. **Evitar:** confirmar ofuscación de auth + revocación de sesión (punto 1 #2/#3) ANTES de submit.
2. **[Apple, alto] Falta Sign in with Apple con Google presente** → rechazo 4.8 casi seguro. **Evitar:** construirlo nativo, o quitar Google de iOS.
3. **[Apple, crítico-runtime] HealthKit sin usage string** → la app **CRASHEA** al pedir permiso (no es solo rechazo). **Evitar:** strings en Info.plist antes de cualquier llamada a HealthKit.
4. **[Apple, medio] Purpose strings vagas** ("la app necesita acceso") → rechazo. **Evitar:** describir el uso real (textos del punto 5).
5. **[Google, alto] Falta la URL web de borrado** o manda a reinstalar la app → rechazo de la App Account Deletion policy. **Evitar:** página email+OTP independiente de la app.
6. **[Google, alto] Health Connect sin `PermissionsRationaleActivity`** o apuntando a otra policy distinta a la del Console → rechazo. **Evitar:** manifest del punto 5 con la MISMA URL.
7. **[Google, medio] Prominent disclosure ausente o puesta en la descripción/web** en vez de in-app pre-permiso → rechazo. **Evitar:** pantalla nativa Why/What/How antes del permiso.
8. **[Google, bloqueante de submit] Target API < 35** → Play rechaza el upload directamente. **Evitar:** compilar API 35+.
9. **[Ambos, medio] Data Safety / App Privacy label inconsistente con el comportamiento real** (declarar que no compartes salud y que un SDK la mande fuera; o no declarar un SDK) → rechazo y posible suspensión. **Evitar:** auditar SDKs; declarar todo lo que sale del dispositivo.
10. **[Ambos, medio] Privacy policy que no cubre retención/borrado/revocación**, o en PDF / geo-bloqueada (Google exige no-PDF, pública, no geofenced) → rechazo. **Evitar:** sección de borrado en /privacidad, HTML público.

---

## 9. Fuentes (URLs)

Apple:
- https://developer.apple.com/app-store/review/guidelines/ (4.8, 5.1.1, 5.1.3)
- https://developer.apple.com/support/offering-account-deletion-in-your-app
- https://developer.apple.com/documentation/bundleresources/information-property-list/nshealthshareusagedescription
- https://developer.apple.com/documentation/bundleresources/information-property-list/nshealthupdateusagedescription
- https://developer.apple.com/app-store/app-privacy-details/
- https://developer.apple.com/app-store/user-privacy-and-data-use/
- https://developer.apple.com/news/?id=mdkbobfo

Google:
- https://support.google.com/googleplay/android-developer/answer/13327111 (account deletion)
- https://support.google.com/googleplay/android-developer/answer/10787469 (data safety)
- https://support.google.com/googleplay/android-developer/answer/10144311
- https://developer.android.com/health-and-fitness/health-connect/get-started
- https://developer.android.com/health-and-fitness/health-connect/publish
- https://support.google.com/googleplay/android-developer/answer/12991134 (health apps declaration)
- https://support.google.com/googleplay/android-developer/answer/16926792 (update 2026 health)
- https://support.google.com/googleplay/android-developer/answer/11150561 (prominent disclosure)
- https://support.google.com/googleplay/android-developer/answer/11926878 + https://developer.android.com/google/play/requirements/target-sdk (target API 35)
- https://android-developers.googleblog.com/2024/03/designing-your-account-deletion-experience-google-play.html

Supabase (patrón de borrado de auth):
- https://deepwiki.com/supabase/auth/8.4-soft-deletion
- https://supabase.com/docs/reference/javascript/auth-admin-deleteuser

---

**Contradicciones / no verificado, dicho explícitamente:**
- **Apple vs Google sobre anonimización:** Apple NUNCA usa la palabra "anonimización" (solo "delete entire account record" + prohíbe "deactivate/disable"); Google SÍ la acepta explícitamente (form: "deletion *or* anonymization within 90 days"). El reporte 3 INTERPRETA (no es texto literal de Apple) que el tombstone cumple el espíritu de Apple. Riesgo residual: un reviewer de Apple estricto podría objetar si la fila persiste con cualquier dato re-identificable. Mitigación = purga real de PII + auth ofuscado.
- **Número de guideline "5.1.1(v)":** la letra del inciso ha cambiado con el tiempo (hilos viejos dicen "(ix)"); la referencia canónica vigente es 5.1.1(v) dentro de "Account Sign-In". No es un número inventado pero verifica la letra al citar en una apelación.
- **Estado real de la action de borrado de dovo (#2/#3 del punto 1):** NO verificado en código — los reportes no tuvieron acceso al repo. Es la pieza #1 a confirmar antes de submit.
- **Domicilio fiscal del aviso:** declarado como faltante por ti; no verificado.