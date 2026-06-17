<!-- Generado por consejo de arquitectura (research en vivo) 2026-06-16. Spec, no codigo. -->

# Spec — app nativa dovo (Expo)

> Síntesis de 3 reportes de research en vivo (jun-2026), anclada al estado real del repo en `//wsl.localhost/ubuntu/home/elmikebutron/dovo`. Donde los reportes se contradicen o algo no se verificó, lo marco con ⚠️.

---

## 1. Recomendación en una línea (qué stack, qué enfoque, por qué)

**Convierte `dovo` en monorepo Turborepo+pnpm, agrega `apps/mobile` con Expo (dev client + prebuild, New Architecture), reescribe la UI de juego en React Native con NativeWind, y reusa tal cual el backend Supabase + la lógica TS pura + los `messages/*.json`** — porque el schema de salud (`core.actividad_metricas`) **ya está construido en producción esperando esto** (los enums `apple_health` / `health_connect` ya existen), y porque el wrapper WebView te haría perder HealthKit, que es justamente la razón de ir nativo. El esfuerzo real es de **~2.5–3.5 meses**, no de días.

---

## 2. Stack y librerías verificadas (estado jun-2026)

| Capa | Elección | Versión / estado verificado | Nota |
|---|---|---|---|
| Runtime nativo | **Expo (dev client + prebuild / CNG)** | SDK actual, **New Architecture obligatoria** | Expo Go **NO** funciona con salud — siempre dev client |
| iOS salud | **`@kingstinct/react-native-healthkit`** | **`14.0.2`, publicada 2026-06-05**, activamente mantenida | Nitro Modules (desde v9). Trae **su propio config plugin** (no companion). PeerDeps: `react ≥19`, `react-native ≥0.79`, `react-native-nitro-modules ≥0.35` |
| Android salud | **`react-native-health-connect` (matinzd)** | **`3.5.3`, publicada 2026-05-15**, mantenida | `minSdkVersion=26`. ⚠️ El companion `expo-health-connect` está **MUERTO** (0.1.1, jul-2024). Configurar con `expo-build-properties` + permisos en AndroidManifest vía prebuild |
| Capa unificada cross-platform | **NO usar** `react-native-health-link` | 0.2.0, ago-2025, inmaduro | Envuelve ambas libs tú mismo detrás de una interfaz `HealthProvider` |
| Auth | `@supabase/supabase-js` + deep links | idéntico a web (RLS/RPC viven en server) | cambia storage adapter + redirects |
| Storage de sesión | `expo-sqlite/localStorage` **o** AsyncStorage | ambos válidos | Expo recomienda `expo-sqlite/localStorage` (SDK 52+); AsyncStorage es lo de los quickstarts |
| i18n | `i18next` + `react-i18next` + `expo-localization` | estándar 2026 | `next-intl` **no corre en RN** |
| Estilos | NativeWind (Tailwind en RN) | — | porta *tokens*, no el JSX |
| Push | `expo-notifications` | — | |
| Build/deploy | EAS Build + EAS Submit | — | EAS Submit gratis, sin Mac |

### ⚠️ Contradicción entre reportes — resuelta

El **Reporte 3 (deployment)** recomienda `react-native-health` (agencyenterprise) para iOS. El **Reporte 1 (health-apis)**, que es más específico y reciente, lo marca como **legacy a evitar**: última versión `1.19.0` de **oct-2024**, sin updates en ~20 meses, Old Architecture.

**Decisión: usa `@kingstinct/react-native-healthkit@14` (Nitro, New Arch).** Es la lib viva. El Reporte 3 acierta en los *usage strings* (`NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription`) y los criterios de review de Apple — esos aplican igual a kingstinct, solo cambia qué config plugin los inyecta.

---

## 3. Qué se reusa y qué se reescribe

Anclado a paths reales del repo:

| Pieza | Path actual | Veredicto |
|---|---|---|
| Backend Supabase (schema `core`, RLS, RPCs `SECURITY DEFINER`) | `dovo/supabase/migrations/` | **Reuso 100%** — no se toca Postgres |
| Schema de salud `core.actividad_metricas` + `core.fuentes_salud` | `supabase/migrations/20260613130000_f25_salud_consentimientos.sql` | **Reuso 100% — ya tiene `fuente in ('apple_health','health_connect')`** |
| Cliente Supabase | `dovo/lib/supabase/` | **Mover a `packages/supabase`** + adaptador de storage RN |
| Lógica de apuestas | `dovo/lib/trato/apuestas-catalogo.ts` | **Comparte en monorepo** (`packages/core`) — TS puro |
| Server actions (trato, check-ins, retos, apuestas, salud) | `dovo/lib/actions/*.ts` | ⚠️ **Mixto** — ver nota abajo |
| i18n | `dovo/messages/es.json`, `messages/en.json` | **Comparte en monorepo** (`packages/i18n`) — JSON idéntico |
| Componentes ceremoniales | `app/_components/VeredictoDialog.tsx`, `LevelUpDialog.tsx`, `app/(app)/retos/_components/DuelResultDialog.tsx` | **Reescribe en RN** (Reanimated) — aquí está el alma |
| Pantallas core (lobby, trato, apuesta, perfil, check-in) | `app/(app)/grupo/[id]/page.tsx`, `app/(app)/perfil/`, `app/(app)/recompensas/`, `app/_components/*` | **Reescribe en RN** |
| Legal (privacidad, términos) | `app/(legal)/privacidad/`, `terminos/` | **WebView** — son páginas estáticas, nadie las "juega" |

⚠️ **Nota crítica sobre las server actions** (`lib/actions/*.ts` llevan `"use server"`): son **Next.js Server Actions**, atadas al runtime de Next. **No se ejecutan en RN.** Tienes dos caminos:
- **(a)** Extraer la lógica de negocio pura a `packages/core` y que cada app la invoque vía su propio cliente Supabase (web: server action; mobile: llamada directa a RPC/tabla con RLS). Es más trabajo pero es la forma correcta.
- **(b)** Convertir las que mobile necesita en **RPCs `SECURITY DEFINER`** en Postgres y llamarlas desde ambas apps por igual. Dado que ya tienes el patrón RPC (ej. `dar_boost`, unirse por código), esto encaja con tu arquitectura. **Recomendado (b) para escrituras con reglas de negocio** (cooldowns, rachas), **(a) para cálculos puros** (scoring, clasificación de premios).

El Reporte 2 asumió que el scoring vivía en archivos sueltos `scoring.ts`; en realidad vive dentro de server actions y catálogos (`lib/trato/`, `lib/actions/`). El refactor a `packages/core` es por tanto un poco mayor de lo que el reporte estimó: hay que *separar* lógica pura de la capa `"use server"`.

---

## 4. Arquitectura propuesta

### Monorepo (no repo aparte)
```
dovo/
├── apps/
│   ├── web/        # Next 15 App Router (lo de hoy: app/, middleware.ts, next.config.ts)
│   └── mobile/     # Expo (nuevo)
├── packages/
│   ├── core/       # lógica TS pura: scoring, leveling, fechas CDMX, apuestas-catalogo, clasificador de premios
│   ├── supabase/   # cliente + tipos generados + wrappers de RPC
│   └── i18n/       # messages/es.json + en.json (hoy en dovo/messages/)
└── pnpm-workspace.yaml + turbo.json
```
- Los paquetes exportan **TS fuente, no JS compilado**; cada app transpila (Next SWC / Metro+Babel). Linkear con `workspace:*`.
- **Para founder solo el monorepo gana**: tu lógica de juego no puede divergir entre plataformas — un bug de scoring que solo aparece en mobile es exactamente lo que evita la fuente única.

⚠️ Caveats verificados (docs.expo.dev/guides/monorepos):
- SDK 52+: config Metro automática vía `expo/metro-config`. Borra `watchFolders` manuales viejos, corre `npx expo start --clear`.
- pnpm isolated install: SDK 54+ lo soporta, pero algunas libs RN rompen → fallback `nodeLinker: hoisted`.
- Fuerza **una sola** versión de React/React Native con `overrides`/`resolutions`.

### Auth con Supabase + deep links (verificado)
- `app.json` → `"scheme": "dovo"` (o `com.dovofit`). En Supabase Auth → Redirect URLs: `dovo://**`.
- Cliente RN: `detectSessionInUrl: false` (no hay URL que parsear), `autoRefreshToken: true`, `persistSession: true`. Registrar listener de `AppState` para `startAutoRefresh`/`stopAutoRefresh` (refresca solo en foreground).
- ⚠️ **`flowType: 'pkce'`**: recomendado para OAuth nativo, pero el Reporte 2 **no lo vio explícito** en la página de Expo — confírmalo contra el quickstart social-auth de Supabase al implementar.
- Google OAuth: `signInWithOAuth({ provider:'google', options:{ redirectTo, skipBrowserRedirect:true }})` → abrir con `expo-web-browser`/`expo-auth-session` → capturar callback con `Linking` → `setSession()`. Browser-based es lo oficialmente soportado y lo más simple para founder solo.
- ⚠️ **API keys legacy de Supabase se deprecan a fin de 2026** → migra a `sb_publishable_*` / `sb_secret_*` ya.

### i18n
Mueve `dovo/messages/{es,en}.json` a `packages/i18n/`. Web los carga vía `next-intl` (`getRequestConfig`); mobile vía `i18next` + `expo-localization`. ⚠️ Si usas sintaxis ICU (`{count, plural, …}`) en next-intl, instala **`i18next-icu`** en mobile para que los JSON queden 100% compartibles sin reescribir strings. Verifícalo al portar tus archivos reales.

---

## 5. Datos de salud → cómo entran a `core.actividad_metricas`

**El backend ya está construido para esto** (no inventes schema nuevo). Tabla verificada:

```sql
core.actividad_metricas (
  checkin_id uuid PK → core.checkins,
  fuente text CHECK (fuente IN ('web_gps','apple_health','health_connect','manual')),
  distancia_m, duracion_s, pasos, fc_promedio,  -- con CHECK de rango
  verificado_ruta boolean,
  origen_externo text   -- añadido por la migración Strava f28
)
core.fuentes_salud (user_id, proveedor IN ('apple_health','health_connect','manual'), estado, scopes[])
```

### Flujo
1. Usuario hace check-in en la app nativa → la app lee **un resumen del entreno** desde HealthKit / Health Connect (distancia, duración, pasos, FC promedio).
2. La app inserta en `core.actividad_metricas` con `fuente='apple_health'` o `'health_connect'`, vinculado al `checkin_id`. **Mismo punto de entrada que el puente Strava** (`fuente` análoga, ya hay índice único en `origen_externo`).
3. `core.fuentes_salud` registra el consentimiento por proveedor (estado `interesado`→`conectado`, scopes otorgados).

### Lo que SÍ se puede
- iOS: 100+ Quantity, 63+ Category, 75+ Workout types — pasos, FC, distancia, energía, sleep analysis. Background delivery vía `"background": true` en el config plugin.
- Android: Activity (Steps, ExerciseSession, Distance, Calories), Vitals (HeartRate, HRV), Sleep. Background reads con permiso `READ_HEALTH_DATA_IN_BACKGROUND` (verificar disponibilidad con Feature Availability API).
- Permisos los inyecta el plugin (iOS) / AndroidManifest + `HealthConnectPermissionDelegate.setPermissionDelegate(this)` en `MainActivity.onCreate` (Android).

### Lo que NO se puede / ojo
- **Web/PWA: ninguna de estas APIs existe en el navegador.** Leer HealthKit/Health Connect **obliga al build nativo** — por eso el puente Strava OAuth (en construcción) es el camino correcto para no bloquear a los usuarios web mientras tanto. **Mantén Strava como fuente web; HealthKit/Health Connect como fuente nativa. Ambas escriben al mismo `core.actividad_metricas`.**
- **Solo guardas resumen, nunca series crudas** — los CHECK constraints de rango ya enforzan minimización (alineado con tu postura LFPDPPP: agregados, HealthKit jamás al Pulse). Mantenlo así.
- Health Connect: historial >30 días requiere `PERMISSION_READ_HEALTH_DATA_HISTORY`. Tipos detrás de feature flags (Skin Temp, Mindfulness, Activity Intensity) — chequear en runtime.
- Clinical Records / FHIR / ECG: soporte limitado, requieren entitlement aprobado por Apple y módulo nativo propio. dovo **no los necesita** — no los pidas.
- Health Connect exige al usuario tener bloqueo de pantalla (PIN/patrón).

---

## 6. Camino a las tiendas (EAS, costos USD, review, OTA)

### Cuentas (cuello de botella de TIEMPO, no de dinero)
- **Apple Developer: $99/año** — paga YA. Obligatorio para App Store y HealthKit.
- **Google Play: $25 pago único.** ⚠️ **DECISIÓN ABIERTA CRÍTICA**: apps de salud existentes debían migrar a **cuenta de organización verificada (D-U-N-S) antes del 28-ene-2026**, y dev individuales nuevos enfrentan **closed-testing de ≥12 testers × 14 días** antes de publicar. **Esto es post-cutoff y define si te registras como individuo u organización — re-confírmalo en vivo en support.google.com ANTES de registrar la cuenta.** Puede costarte 2–3 semanas de calendario.

### EAS (precios verificados en expo.dev/pricing, jun-2026)
- **Quédate en Free.** 15 iOS + 15 Android builds/mes alcanzan de sobra para founder solo. Cada build cuesta $1–$4 (tarifa plana, no por minuto). EAS Submit **gratis** (sube binarios sin Mac).
- Sube a **Starter ($19/mes)** solo si pegas con el **timeout de 45 min** del Free (árboles de deps pesados; Starter da 2h). No necesitas Production ($199) hasta >3,000 MAU en OTA.
- Build time típico ~10–20 min (máquinas iOS en M4 Pro).

### Review con salud
- **iOS:** usage strings en Info.plist (los inyecta el plugin de kingstinct). **Menciona la integración con la app Salud (Health) en la descripción del store Y en la UI** — es la **causa #1 de rechazo**. Privacy policy URL: ya tienes `/privacidad v1.0` → sirve. Declara la "nutrition label" de Health & Fitness. Guideline 5.1.3 (no usar datos de salud para ads/marketing) + 1.4.1 (si das consejo de dieta/dosis, disclaimers). **Tiempos: apps de salud 5–14 días** (escrutinio extra; volumen iOS +80% YoY en Q1-2026).
- **Android:** **Health apps declaration form** (obligatoria para toda app publicada, incluso en testing) + **Health Connect declaration form** (justificar por escrito cada permiso `READ_*`). **No pidas permisos que no uses.** Privacy policy URL: la tuya sirve.

### OTA (EAS Update)
- **SÍ por OTA (sin re-review):** bugfixes JS/TS, copy, traducciones, estilos, layouts, assets no-nativos, ajustes de gamificación. Rollouts graduales por %.
- **NO por OTA (requiere build + re-review):** código nativo, **nuevos permisos de HealthKit/Health Connect**, upgrade de SDK Expo, cualquier cambio de binario. Apple es estricto (2.5.2): un OTA no puede cambiar el propósito de la app.
- ⚠️ **WebView wrapper (TWA/WKWebView): descartado.** En iOS arriesga rechazo por Guideline 4.2 (minimum functionality) y **pierde HealthKit por completo**. En Android, un TWA **no accede a Health Connect nativo**. El atajo te quita justo el diferencial. Como ya estarás en Expo, tienes binario nativo real + OTA — el wrapper es un paso atrás.

---

## 7. Plan por fases (esfuerzo realista, founder solo)

⚠️ Estas estimaciones son del Reporte 2 (no verificables) + mi ajuste por el refactor de server actions. **Es de meses.**

| Fase | Entregable | Esfuerzo |
|---|---|---|
| **0. Cuentas (en paralelo, empieza HOY)** | Apple $99 pagado; decisión Play individuo/org resuelta en vivo | calendario 2–3 sem (no bloquea código) |
| **1. Monorepo** | Mover Next a `apps/web`; extraer `packages/core` + `supabase` + `i18n`; **separar lógica pura de `"use server"`** y/o promover escrituras a RPCs. Web sigue funcionando igual. | **1–1.5 sem** (el reporte dijo 1 sem; +0.5 por las server actions) |
| **2. `apps/mobile` esqueleto** | Expo dev client, auth deep-link + Google OAuth, navegación, i18next | ~1 sem |
| **3. MVP nativo mínimo** | Login + 1 pantalla de juego (lobby/trato) + check-in + **HealthKit/Health Connect escribiendo a `core.actividad_metricas`** + push. Esto ya justifica la app nativa. | **2–3 sem** |
| **4. Paridad core** | 6 pantallas (lobby, trato/TratoHUD, apuesta semanal, retos, check-in, perfil) en RN con NativeWind; WebView para legal | **3–5 sem** |
| **5. Ceremonias** | Veredicto, DuelResult, LevelUp con Reanimated — *el alma del juego, no lo escatimes* | **1–2 sem** |
| **6. Pulido + tiendas** | gestos, EAS Build, TestFlight + Play Internal, fichas con salud, review | **2 sem + 5–14 días review iOS + 14 días closed-testing Android** |

**Total realista: ~2.5–3.5 meses** de trabajo enfocado, más la cola de review/testing que no controlas. No prometas fecha de lanzamiento antes de pasar Fase 0.

---

## 8. Riesgos y decisiones abiertas para Miguel

1. **🔴 Play individuo vs. organización (BLOQUEANTE, post-cutoff, sin verificar en vivo).** Si tu categoría de salud exige cuenta de organización verificada (D-U-N-S), cambia tu setup legal y suma semanas. **Acción: verifícalo en support.google.com ANTES de pagar los $25.** Esto puede ser el cuello de botella mayor de todo el proyecto.
2. **🟠 Refactor de server actions.** Tu lógica de juego vive dentro de archivos `"use server"` (`lib/actions/*.ts`), no en módulos puros. Hay que separar lógica pura (→ `packages/core`) de escrituras con reglas (→ RPCs). El Reporte 2 subestimó esto al asumir archivos `scoring.ts` sueltos.
3. **🟠 New Architecture obligatoria.** kingstinct@14 es Nitro → fuerza New Arch. Si alguna otra dependencia tuya no la soporta aún, tendrás fricción. Audita deps RN antes de comprometerte.
4. **🟡 `flowType: 'pkce'` y `AppState` autorefresh** no se vieron explícitos en la doc de Expo que fetcheó el research — confírmalos contra el quickstart social-auth de Supabase al implementar (no son bloqueantes, son verificaciones).
5. **🟡 Companion `expo-health-connect` muerto.** La doc de matinzd apunta a un paquete abandonado; configura con `expo-build-properties`. Espera que la doc oficial te confunda — confía en el build real.
6. **🟡 ICU vs i18next.** Si tus `messages/*.json` usan plurales ICU, necesitas `i18next-icu` en mobile o reescribir strings. Revisa tus JSON reales antes de portar.
7. **🟢 Strava no se desperdicia.** Sigue siendo tu fuente de salud para web (donde HealthKit no existe). Mantén ambas escribiendo a `core.actividad_metricas`. No es trabajo tirado.
8. **Honestidad de fondo:** esto es un proyecto de **meses para un founder solo**, en paralelo a mantener web en prod. El mayor riesgo no es técnico (el stack está verificado y el backend ya está listo) — es de **calendario y foco**: la cola de review de salud (5–14 días iOS) y el closed-testing de Android no se aceleran con código.

---

## 9. Fuentes (con fecha — verificadas en vivo 17-jun-2026)

**Salud (Reporte 1):**
- @kingstinct README — github.com/kingstinct/react-native-healthkit/blob/master/README.md (v14.0.2, 2026-06-05)
- kingstinct docs — kingstinct.com/react-native-healthkit/
- react-native-health-connect docs — matinzd.github.io/react-native-health-connect/docs/get-started/ (v3.5.3, 2026-05-15)
- Android Health Connect data types — developer.android.com/health-and-fitness/health-connect/data-types
- Android read/background — developer.android.com/health-and-fitness/health-connect/read-data
- Expo feature request HealthKit/Google Fit — expo.canny.io/feature-requests/p/apple-healthkitgoogle-fit-data
- npm registry (versiones/fechas)

**Reuso (Reporte 2):**
- Using Supabase — docs.expo.dev/guides/using-supabase/
- Native Mobile Deep Linking — supabase.com/docs/guides/auth/native-mobile-deep-linking
- Social Auth con Expo RN — supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth
- Monorepos — docs.expo.dev/guides/monorepos/
- Localization — docs.expo.dev/guides/localization/

**Deployment (Reporte 3):**
- Expo pricing — expo.dev/pricing · Expo billing plans — docs.expo.dev/billing/plans/
- Apple App Review Guidelines — developer.apple.com/app-store/review/guidelines/ (4.2, 5.1.3, 1.4.1)
- Health apps declaration form — support.google.com/googleplay/android-developer/answer/14738291
- Publish health app on Google Play — developer.android.com/health-and-fitness/health-connect/publish
- Google Play health 2026 requirements — myappmonitor.com/blog/google-play-health-apps-update-2026-requirements
- EAS Update — docs.expo.dev/eas-update/introduction/
- Apple 4.2 webview rejection — mobiloud.com/blog/app-store-review-guidelines-webview-wrapper

**Repo (verificado en esta sesión):**
- `dovo/supabase/migrations/20260613130000_f25_salud_consentimientos.sql` — `core.actividad_metricas` y `core.fuentes_salud` (enums `apple_health`/`health_connect` ya existen)
- `dovo/supabase/migrations/20260616130000_f28_strava.sql` — `origen_externo` (puente web)
- `dovo/lib/actions/salud.ts`, `dovo/lib/trato/apuestas-catalogo.ts`, `dovo/messages/{es,en}.json`

---

**Archivos clave del repo para anclar la migración** (todos absolutos vía `//wsl.localhost/ubuntu/home/elmikebutron/dovo/`):
- Backend de salud listo: `supabase/migrations/20260613130000_f25_salud_consentimientos.sql`
- Puente web Strava: `supabase/migrations/20260616130000_f28_strava.sql`
- Lógica de apuestas (→ `packages/core`): `lib/trato/apuestas-catalogo.ts`
- Server actions a refactorizar: `lib/actions/{salud,apuestas,trato,checkins,retos}.ts`
- i18n a compartir: `messages/es.json`, `messages/en.json`
- Ceremonias a reescribir en RN: `app/_components/VeredictoDialog.tsx`, `app/_components/LevelUpDialog.tsx`, `app/(app)/retos/_components/DuelResultDialog.tsx`