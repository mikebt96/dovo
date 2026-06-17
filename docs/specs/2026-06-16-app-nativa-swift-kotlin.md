<!-- Consejo de arquitectura nativa, research en vivo 2026-06-17. Versiones se mueven: re-verificar al arrancar. -->

# Spec — apps nativas dovo (iOS Swift + Android Kotlin)

> Dos codebases separados. Backend Supabase en prod (schema `core`, RLS, RPCs SECURITY DEFINER) ya está listo — el nativo NO toca el schema, solo consume RPCs y lee salud. Diseño "Mesa Nocturna": chrome calmado, color/motion solo en lo que está en juego (trato/apuesta/resultado). Founder solo con Mac. Yo escribo el código; él compila en Xcode / Android Studio.
>
> **Honestidad de entrada:** este es un build de meses. Las versiones abajo son las que los 4 reportes verificaron en vivo el 2026-06-17, pero las libs móviles se mueven rápido (supabase-swift saca varias releases/mes). Pineo versiones exactas y marco lo que NO se verificó.

---

## 1. Versiones verificadas (2026-06-17)

| SDK / lib | Versión exacta | Fuente / nota |
|---|---|---|
| **supabase-swift** | `v2.48.0` (publicada 2026-06-17, HOY) | GitHub releases API. Se mueve rápido — pinear `from: "2.48.0"` (Up to Next Major). |
| **supabase-kt** (Android) | `3.6.0` (publicada ~27-28 abr 2026) | Maven Central + repo. Módulo auth = `auth-kt` (NO `gotrue-kt`, archivado). Group `io.github.jan-tennert.supabase`. |
| Ktor (req. supabase-kt 3.x) | `3.4.3` (repo); floor `3.4.0` | `libs.versions.toml` upstream. |
| Kotlin (upstream supabase-kt) | `2.4.0` | `libs.versions.toml` real (el badge dice 2.3.21 — el valor verídico es 2.4.0). Tu proyecto puede usar 2.x ≥ 2.1; alinea el plugin de serialización. |
| **HealthKit** | API descriptors async/await, **iOS 15.4+** | Apple docs. La gen clásica (`HKQuery`+completion) es legacy; targeteamos lo moderno. |
| **Health Connect** (`androidx.health.connect:connect-client`) | **`1.1.0` ESTABLE** (8-oct-2025) | developer.android.com. Alpha `1.2.0-alpha04` (22-abr-2026) — NO usar en prod. |
| Swift tools mín. (supabase-swift) | `5.10` → Xcode ≥ 15.3 | `Package.swift`. **No hay "Xcode mínimo" oficial de Supabase** — se deriva de Swift 5.10. Para iOS 18 SDK / Swift 6 → Xcode 16+. |
| iOS floor de la lib | iOS 13.0 | `Package.swift`. **Pero targeteamos iOS 16+** (SwiftUI moderno + HealthKit descriptors 15.4 + `.healthDataAccessRequest`). |
| minSdk Android | **26** (Android 8) | Health Connect SDK = API 26; supabase-kt = 26. Si bajaras de 26 → core library desugaring. App de Health Connect en device requiere Android 9/API 28 (Android 14+ la trae integrada). |

**Contradicción / hueco a marcar:**
- Ningún reporte fija "Xcode mínimo" oficial — es derivado (Swift ≥ 5.10). Asumo **Xcode 16** como base de trabajo (founder tiene Mac, instala la última).
- Versión de Compose / compileSdk Android: supabase-kt es agnóstico, no la impone. Decido yo: **compileSdk 35, Compose BOM vigente** (ver §3).
- Persistencia por defecto de sesión en Android: el reporte lo infiere (Settings/SharedPreferences) pero no es literal en docs. Refresh automático SÍ está documentado. Decisión: arrancar con default, migrar a EncryptedSharedPreferences antes de release (§4).

---

## 2. iOS — estructura del proyecto

**Toolchain objetivo:** Xcode 16, Swift 6 (modo migración gradual), **iOS deployment target 16.0**.

**Por qué 16 y no 13/15.4:** floor de la lib es 13, HealthKit descriptors piden 15.4, pero quiero `Observation` (`@Observable`), `NavigationStack` estable y `.healthDataAccessRequest`. 16 es el piso sano; cubre >98% de devices activos en 2026.

**Gestión del proyecto: XcodeGen.** El founder edita en Xcode, pero yo no puedo generar un `.xcodeproj` binario a mano sin romperlo. Defino `project.yml` (texto, versionable, lo escribo yo) y él corre `xcodegen generate`. Alternativa si rechaza la dependencia: Swift Package como app target (Xcode 16 lo soporta), pero XcodeGen da más control sobre entitlements/Info.plist.

**SPM deps (en `project.yml`):**
```
https://github.com/supabase/supabase-swift  — from: "2.48.0", product: Supabase
```
Solo el product paraguas `Supabase` (`import Supabase`). Sin deps extra para auth/health (HealthKit es framework del sistema).

**Organización de carpetas:**
```
dovo-ios/
  project.yml                     ← yo lo escribo; él corre xcodegen
  Sources/
    App/
      DovoApp.swift               ← @main, inyecta SupabaseClient + stores
      Config.xcconfig             ← SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (NO en git)
    Core/
      Supabase/
        SupabaseManager.swift     ← cliente singleton, schema "core" global, PKCE
        AuthRepository.swift      ← magic link, Google, authStateChanges
        RPC.swift                 ← wrappers tipados de apply_checkin/dar_boost/unirse_con_token/salir_del_trato
        DTOs.swift                ← Codable structs que mapean rows/RPC returns
      Health/
        HealthKitService.swift    ← permisos + resumen de entreno + sueño
        HealthSync.swift          ← resumen → RPC a core.actividad_metricas
      DesignSystem/
        Theme.swift               ← "Mesa Nocturna": chrome neutro + acentos en-juego
        Motion.swift              ← animaciones SOLO trato/apuesta/resultado
    Features/
      Lobby/ Trato/ Apuesta/ Misiones/ CheckIn/ Perfil/
        <Feature>View.swift
        <Feature>Model.swift      ← @Observable, llama Core/*
  Resources/
    Info.plist                    ← NSHealthShareUsageDescription, CFBundleURLTypes
    dovo.entitlements             ← com.apple.developer.healthkit
  Tests/
```

**Config secreta:** `Config.xcconfig` con las keys, gitignored; un `.example` versionado. La publishable key es pública por diseño (RLS protege), pero no la commiteo por higiene.

---

## 3. Android — estructura del proyecto

**Toolchain:** Android Studio (founder), AGP vigente, **Kotlin 2.x (≥ 2.1, idealmente alineado a 2.4.0)**, **minSdk 26, compileSdk 35, targetSdk 35**, Jetpack Compose (BOM vigente), Material 3.

**Gradle KTS + version catalog** (`gradle/libs.versions.toml`):
```toml
[versions]
supabase = "3.6.0"
ktor = "3.4.3"
kotlin = "2.4.0"
healthConnect = "1.1.0"          # ESTABLE
composeBom = "<BOM vigente>"     # él lo confirma en AS

[libraries]
supabase-bom        = { module = "io.github.jan-tennert.supabase:bom", version.ref = "supabase" }
supabase-auth       = { module = "io.github.jan-tennert.supabase:auth-kt" }
supabase-postgrest  = { module = "io.github.jan-tennert.supabase:postgrest-kt" }
supabase-realtime   = { module = "io.github.jan-tennert.supabase:realtime-kt" }
ktor-client-android = { module = "io.ktor:ktor-client-android", version.ref = "ktor" }
health-connect      = { module = "androidx.health.connect:connect-client", version.ref = "healthConnect" }
```
`app/build.gradle.kts`:
```kotlin
plugins { kotlin("plugin.serialization") version "2.4.0" }
dependencies {
    implementation(platform(libs.supabase.bom))   // BOM fija versiones de módulos
    implementation(libs.supabase.auth)
    implementation(libs.supabase.postgrest)
    implementation(libs.supabase.realtime)         // si usamos live updates de trato
    implementation(libs.ktor.client.android)        // engine obligatorio
    implementation(libs.health.connect)
}
```
Realtime necesita engine Ktor con WebSockets → `ktor-client-android` sirve.

**Organización (paquetes):**
```
dovo-android/
  app/
    build.gradle.kts
    src/main/
      AndroidManifest.xml          ← deep link intent-filter + permisos health.* + PermissionsRationale
      java/com/dovo/app/
        DovoApplication.kt         ← createSupabaseClient (schema core, PKCE)
        MainActivity.kt            ← handleDeeplinks(intent), Compose host
        core/
          supabase/
            Supabase.kt            ← cliente
            AuthRepository.kt
            Rpc.kt                 ← wrappers de RPCs
            Dtos.kt                ← @Serializable
          health/
            HealthConnectService.kt
            HealthSync.kt          ← resumen → RPC core.actividad_metricas
          design/
            Theme.kt               ← Mesa Nocturna
            Motion.kt
        feature/
          lobby/ trato/ apuesta/ misiones/ checkin/ perfil/
            <Feature>Screen.kt
            <Feature>ViewModel.kt
      res/
        PermissionsRationaleActivity ← obligatoria para Play (privacidad health)
  gradle/libs.versions.toml
  local.properties                 ← supabase url/key (gitignored)
```
Las keys vía `local.properties` → `BuildConfig` (gitignored).

---

## 4. Auth con Supabase (magic link + Google)

**Schema `core` — decisión idéntica en ambas plataformas: fijarlo GLOBAL en el cliente.** Así `rpc(...)` y `from(...)` apuntan a `core` sin encadenar nada por llamada. Crítico porque las firmas de `rpc()` NO aceptan schema per-call (verificado en ambos SDKs).

**Pre-requisito de servidor (lo verifica el founder en dashboard, 1 vez):** Settings → API → **Exposed schemas** debe incluir `core`, y `authenticated` debe tener `EXECUTE` en los RPCs. Si falta → `PGRST106`. Esto YA debería estar (la web lo usa), pero hay que confirmarlo.

### iOS
```swift
let supabase = SupabaseClient(
  supabaseURL: URL(string: SUPABASE_URL)!,
  supabaseKey: SUPABASE_PUBLISHABLE_KEY,
  options: SupabaseClientOptions(
    db: .init(schema: "core"),          // ← RPC/PostgREST global a core
    auth: .init(flowType: .pkce)        // PKCE en móvil
  )
)
```
- **Magic link:** `signInWithOTP(email:, redirectTo: URL("io.dovo.app://login-callback"))`.
- **Google:** `signInWithOAuth(provider: .google, redirectTo: ...)` con `ASWebAuthenticationSession`.
- **Deep link:** registrar scheme `io.dovo.app` en `Info.plist` (`CFBundleURLTypes`). En SwiftUI: `.onOpenURL { url in Task { try await supabase.auth.session(from: url) } }` para el magic link abierto desde el correo. (OAuth resuelve dentro del flujo.)
- **Sesión:** persiste en Keychain por default; **auto-refresh ON** por default. Suscribir `for await (event, session) in supabase.auth.authStateChanges` para enrutar signedIn/signedOut.
- **Honestidad:** la doc oficial no muestra UN snippet verbatim que combine `.google` + `redirectTo` + closure; es la interpolación correcta de dos patrones documentados. El método y el provider existen.

### Android
```kotlin
val supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) {
    install(Auth) {
        scheme = "io.dovo.app"; host = "login-callback"
        flowType = FlowType.PKCE
    }
    install(Postgrest) { defaultSchema = "core" }   // ← RPC/PostgREST global a core
    install(Realtime)
}
```
- **Magic link / OTP:** `auth.signInWith(OTP) { email = "..." }`; verificar con `verifyEmailOtp(...)` si usamos código.
- **Google:** `auth.signInWith(Google)` (abre Custom Tab → vuelve por deep link). Alternativa nativa: Credential Manager (Native Google Auth).
- **Deep link:** `intent-filter` con `scheme=io.dovo.app host=login-callback` en el manifest; en `onCreate`: `supabase.handleDeeplinks(intent)`.
- **Registrar `io.dovo.app://login-callback` en dashboard Supabase → Additional Redirect URLs** (mismo valor para iOS y Android — funciona porque el scheme es idéntico; si el founder quiere separarlos, dos entradas).
- **Sesión:** persiste + refresca sola (SessionManager default sobre SharedPreferences). **Antes de release: inyectar SessionManager con EncryptedSharedPreferences/DataStore** para cifrar el refresh token.

**Decisión transversal:** mismo `redirectTo` (`io.dovo.app://login-callback`) en las dos apps. El founder agrega esa URL a la allow-list una vez.

---

## 5. Datos de salud → `core.actividad_metricas` vía RPC

**Patrón común:** leer un **resumen compacto** del último entreno (tipo, duración, distancia, FC promedio) — NUNCA el trail GPS muestra-por-muestra — y escribirlo a `core.actividad_metricas` con `fuente='apple_health'` (iOS) / `fuente='health_connect'` (Android), valores YA permitidos en el CHECK de la tabla.

**Regla regulatoria (memoria LFPDPPP + App Store/Play):** el dato crudo de salud NO sale del device para ads ni se vende. Aquí solo validamos el entreno y escribimos un agregado mínimo vía RPC. Encaja con el pipeline regulado. **HealthKit/Health Connect → solo lectura** (no escribimos a Health).

**Vía de escritura:** NO insertar directo en la tabla. Llamar un RPC SECURITY DEFINER (ya existe `apply_checkin`; si valida entreno con métricas, reusarlo; si no, el founder añade un RPC `registrar_metrica(fuente, tipo, duracion_min, distancia_km, fc_promedio, ...)`). **Esto es un hueco a confirmar con el founder: ¿`apply_checkin` ya acepta payload de métricas, o creo un RPC nuevo?** No lo invento.

### iOS — HealthKit
- **Capability** HealthKit + entitlement `com.apple.developer.healthkit`.
- **Info.plist:** `NSHealthShareUsageDescription` (obligatoria, lectura). NO `NSHealthUpdateUsageDescription` (no escribimos). Quitar `healthkit` de Required device capabilities si la app debe instalar en iPads sin Health.
- **Usage string sugerida (concreta, como exige 5.1.3):** *"dovo lee tus entrenos de Salud para validar tus retos con tu dúo y registrar tu progreso."*
- **Permisos:** `requestAuthorization(toShare: [], read: [...])` con stepCount, distanceWalkingRunning, heartRate, sleepAnalysis, workoutType.
- **Resumen de entreno:** workout más reciente con `HKSampleQueryDescriptor` → `duration`, `workoutActivityType`; distancia con `workout.statistics(for:.distanceWalkingRunning)`; **FC promedio NO desde `workout.statistics(.heartRate)`** (no fiable) → query de muestras de FC en el rango con `.discreteAverage`.
- **Privacidad:** por diseño NO se puede distinguir "permiso negado" de "sin datos" en lectura. La UI no debe ramificar sobre "denegado" — degrada a "sin entreno detectado, regístralo manual".
- **SwiftUI:** `import HealthKitUI` + `.healthDataAccessRequest(...)` como alternativa declarativa al request imperativo. Resultados de query corren en background → `await MainActor.run {}` para UI.

### Android — Health Connect
- **Dependencia:** `connect-client:1.1.0`.
- **Manifest:** permisos `android.permission.health.READ_STEPS/READ_DISTANCE/READ_HEART_RATE/READ_EXERCISE/READ_SLEEP`; `<queries>` con `com.google.android.apps.healthdata`; **`PermissionsRationaleActivity` OBLIGATORIA** (Play la exige) — `ACTION_SHOW_PERMISSIONS_RATIONALE` (Android ≤13) + `activity-alias ViewPermissionUsageActivity` (Android 14+).
- **Disponibilidad:** `getSdkStatus()` → si `SDK_UNAVAILABLE` esconder features de salud; si `PROVIDER_UPDATE_REQUIRED` mandar a Play Store.
- **Permisos:** `PermissionController.createRequestPermissionResultContract()`; chequear `getGrantedPermissions()` antes de leer (el usuario puede revocar en cualquier momento).
- **Lectura:** pasos/distancia con `aggregate()` (NO doble-contar entre fuentes); FC con `readRecords(HeartRateRecord)` (.samples); workouts con `readRecords(ExerciseSessionRecord)` → duración (`Duration.between(start,end)`), tipo (`exerciseType`), distancia con `aggregate(DISTANCE_TOTAL)` en el rango de la sesión. Todo `suspend` → `Dispatchers.IO`.
- **Play policy:** declarar cada permiso de salud en Console + privacy activity; prohibido vender/transferir/usar para ads (clarificación 15-abr-2026: tampoco empleo/seguros).

**FC promedio en Android:** Health Connect no da "avg" agregado de FC tan limpio como distancia — promediar los `.beatsPerMinute` de los samples en el rango de la sesión en el cliente (Kotlin). Marco esto como decisión de implementación, no como API que dé el avg directo.

---

## 6. Mapa de pantallas a portar + orden

La web ya tiene estas. Orden por **valor de validación / riesgo técnico**, no por vistosidad. "Color/motion solo en lo que está en juego" → Trato/Apuesta/Resultado son las pantallas con vida; el resto chrome calmado.

| # | Pantalla | Qué hace | Backend que toca | Orden | Por qué ese orden |
|---|---|---|---|---|---|
| 1 | **Perfil** | datos del user, fuentes de salud conectadas | `core.fuentes_salud`, auth | 2º | simple, valida auth+lectura end-to-end |
| 2 | **Lobby** | estado actual, entrar a trato, navegación | listar trato/dúo | 3º | hub de navegación; chrome calmado |
| 3 | **Trato** | el dúo, estado del trato (`estado_trato`) | `unirse_con_token`, `salir_del_trato` | 4º | núcleo social; aquí empieza el color/motion |
| 4 | **Apuesta** | lo que está en juego, boosts | `dar_boost` | 5º | pantalla "viva" — motion sí |
| 5 | **Misiones** | retos/objetivos del periodo | listar retos | 6º | depende de trato existente |
| 6 | **Check-in** | registrar avance + validar con salud | `apply_checkin` + HealthSync | 7º (último, integra todo) | une auth + RPC + HealthKit/HC; mayor riesgo, va al final |

**Orden recomendado de build:** Auth (no es pantalla, es §4) → Perfil → Lobby → Trato → Apuesta → Misiones → Check-in. Cada pantalla aterriza primero la lectura, luego la mutación (RPC).

> **Hueco:** los nombres exactos de los RPC de listar (retos, dúo) y de las columnas no están todos en el brief — los confirmo contra el schema real antes de tipar los DTOs. No invento nombres de funciones.

---

## 7. Plan por fases (founder solo)

Cada fase: **qué entrego yo** (código compilable) / **qué hace y verifica él** (en Mac/AS). Hago iOS y Android en paralelo por fase para que vea progreso simétrico.

**Fase 0 — Skeleton que compila (sin features)**
- Yo: `project.yml` + `DovoApp.swift` vacío con tab bar de 6 pantallas placeholder (iOS); `libs.versions.toml` + `build.gradle.kts` + `MainActivity` Compose con 6 tabs placeholder (Android). SupabaseManager configurado pero sin llamadas.
- Él: instala XcodeGen, `xcodegen generate`, abre en Xcode 16, **compila y corre en simulador**. En AS: sync Gradle, **corre en emulador API 26+**. Pone URL+key en config local. Confirma dashboard: schema `core` expuesto, RPCs con EXECUTE.
- Gate: ambas apps abren y muestran 6 tabs vacíos.

**Fase 1 — Auth end-to-end**
- Yo: AuthRepository (magic link + Google), deep link handling, authStateChanges → routing login/app.
- Él: registra scheme + redirect URL en dashboard; configura Google OAuth en Supabase si no está; **prueba login real con su email y con Google** en device físico (deep link no siempre funciona en simulador iOS).
- Gate: login → sesión persiste → reabre app y sigue logueado.

**Fase 2 — Perfil + Lobby (lectura)**
- Yo: DTOs, lectura de perfil y `fuentes_salud`, Lobby con estado.
- Él: corre, ve sus datos reales.
- Gate: datos de prod aparecen, RLS no bloquea.

**Fase 3 — Trato + Apuesta (mutaciones + primer motion)**
- Yo: wrappers `unirse_con_token`/`salir_del_trato`/`dar_boost`, Theme "Mesa Nocturna", Motion en Trato/Apuesta.
- Él: prueba unirse con token real, dar boost; verifica que el estado cambia en la web también.
- Gate: una mutación nativa se refleja en la web (mismo backend).

**Fase 4 — HealthKit / Health Connect (lectura de salud)**
- Yo: HealthKitService + HealthConnectService, permisos, resumen de entreno, `getSdkStatus`/availability.
- Él: HealthKit pide cuenta de dev pagada y device físico (no simulador para datos reales); en Android, instala Health Connect, mete un entreno de prueba. **Confirma conmigo si `apply_checkin` acepta métricas o si crea RPC `registrar_metrica`.**
- Gate: app lee su último entreno y muestra el resumen en pantalla (todavía sin escribir).

**Fase 5 — Check-in completo (integra todo)**
- Yo: HealthSync → RPC a `core.actividad_metricas`, pantalla Check-in que valida con salud, Misiones.
- Él: hace un check-in real validado por su Apple Watch / Health Connect; verifica fila en `core.actividad_metricas` con la fuente correcta.
- Gate: check-in nativo escribe métrica con `fuente in ('apple_health','health_connect')`.

**Fase 6 — Hardening pre-store**
- Yo: EncryptedSharedPreferences (Android), manejo de revocación de permisos, estados de error/sin-datos, usage strings finales, PermissionsRationaleActivity pulida.
- Él: llena App Store Connect / Play Console, declara permisos de salud, privacy policy, screenshots; build de release firmado.
- Gate: builds de release pasan App Review 5.1.3 / Play health policy.

> **Realismo:** esto es trabajo de meses para una persona. HealthKit exige cuenta Apple Developer pagada ($99/año) y testing en device físico. Play exige privacy activity + declaración de permisos o rechaza. No hay atajo a esas dos.

---

## 8. Riesgos y lo NO verificable desde mi entorno

1. **No tengo el schema real `core` a la vista.** Nombres exactos de RPCs de lectura (retos, dúo), columnas de `actividad_metricas`, y si `apply_checkin` acepta payload de métricas o necesito un RPC nuevo → **el founder o yo lo confirmamos contra el schema antes de tipar DTOs.** No inventé firmas.
2. **Versiones móviles se mueven.** supabase-swift 2.48.0 salió HOY; puede haber 2.49+ cuando el founder arranque. Pinear y subir deliberado, no auto.
3. **"Xcode mínimo" es derivado, no oficial** (Swift ≥ 5.10). Asumo Xcode 16.
4. **Compose BOM / compileSdk exactos** los confirma el founder en AS (supabase-kt es agnóstico). Puse 35 como decisión.
5. **Persistencia default Android** (Settings/SharedPreferences) es inferencia del reporte, no doc literal. Refresh automático sí documentado. Mitigo migrando a Encrypted antes de release.
6. **Snippet Google OAuth iOS** (`.google`+`redirectTo`+closure) es interpolación de patrones documentados, no verbatim oficial. Hay que probarlo en device.
7. **No puedo compilar nada.** No tengo Mac ni Android Studio aquí. Todo lo que entrego lo compila él; las primeras iteraciones tendrán ajustes de imports/firmas que solo se ven al compilar. Presupuestar ida y vuelta en Fase 0-1.
8. **FC promedio Android** se calcula client-side promediando samples; no es un agregado nativo limpio como en HealthKit (donde tampoco viene fiable del workout). Decisión de implementación.
9. **Deep links en simulador iOS** son poco fiables para magic link → testear login en device físico desde Fase 1.
10. **Google OAuth requiere config en consola** (client IDs) además del código — tarea del founder en Supabase dashboard + Google Cloud.

---

## 9. Fuentes (URLs)

**supabase-swift**
- Repo / release v2.48.0: https://github.com/supabase/supabase-swift · `https://api.github.com/repos/supabase/supabase-swift/releases/latest`
- `Package.swift` (swift-tools 5.10, iOS 13, products): https://raw.githubusercontent.com/supabase/supabase-swift/main/Package.swift
- Source (`schema()`, `rpc()`, `authStateChanges`, `session(from:)`, `autoRefreshToken`): `.../main/Sources/Supabase/SupabaseClient.swift` · `.../main/Sources/Auth/AuthClient.swift`
- Quickstart iOS/SwiftUI: https://supabase.com/docs/guides/getting-started/quickstarts/ios-swiftui
- Ref Swift: https://supabase.com/docs/reference/swift/initializing · `/auth-signinwithotp` · `/auth-signinwithoauth` · `/rpc`

**supabase-kt**
- Repo / releases 3.6.0: https://github.com/supabase-community/supabase-kt · `/releases`
- Maven Central BOM: https://central.sonatype.com/artifact/io.github.jan-tennert.supabase/bom
- `libs.versions.toml`: https://raw.githubusercontent.com/supabase-community/supabase-kt/master/gradle/libs.versions.toml
- Install / init / deep linking / rpc: https://supabase.com/docs/reference/kotlin/installing · `/initializing` · https://supabase.com/docs/guides/auth/native-mobile-deep-linking · https://supabase.com/docs/reference/kotlin/rpc
- Dokka Postgrest (`from(schema,table)`, sobrecargas `rpc`): https://supabase-community.github.io/supabase-kt/postgrest-kt/io.github.jan.supabase.postgrest/-postgrest/index.html
- PGRST106 (exponer schema): https://supabase.com/docs/guides/troubleshooting/pgrst106-the-schema-must-be-one-of-the-following-error-when-querying-an-exposed-schema

**HealthKit**
- Setup: https://developer.apple.com/documentation/healthkit/setting-up-healthkit · https://developer.apple.com/documentation/xcode/configuring-healthkit-access
- Auth / lectura: https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data · `/requestauthorization(toshare:read:)` · `/hkstatisticsquerydescriptor` · `/reading-data-from-healthkit` · `/protecting-user-privacy`
- Workout / queries: https://developer.apple.com/documentation/healthkit/hkworkout · `/hksamplequerydescriptor` · `/hksamplepredicate` · `/hkcategoryvaluesleepanalysis`
- WWDC25 322: https://developer.apple.com/videos/play/wwdc2025/322/
- App Review 5.1.3: https://developer.apple.com/app-store/review/guidelines/ · https://developer.apple.com/design/human-interface-guidelines/healthkit

**Health Connect**
- Releases / versión: https://developer.android.com/jetpack/androidx/releases/health-connect · https://mvnrepository.com/artifact/androidx.health.connect/connect-client
- Get started (setup/manifest/permisos): https://developer.android.com/health-and-fitness/health-connect/get-started
- Read data: https://developer.android.com/health-and-fitness/health-connect/read-data
- Play health policy: https://support.google.com/googleplay/android-developer/answer/12991134 · anuncio 15-abr-2026: https://support.google.com/googleplay/android-developer/answer/16926792 · https://developers.google.com/health/policies/health-api-developer-user-data-policy

---

**Resumen ejecutivo para el founder:** dos codebases, iOS 16+ (Xcode 16, supabase-swift 2.48.0) y Android minSdk 26 (supabase-kt 3.6.0 + Health Connect 1.1.0). Schema `core` se fija global en el cliente en ambas. Salud = solo lectura, resumen mínimo → RPC, nunca el dato crudo afuera. Build por fases con gate compilable en cada una; las dos cosas sin atajo son la cuenta Apple Developer pagada (HealthKit en device físico) y la privacy activity de Play. Lo único que necesito de ti antes de tipar DTOs: confirmar nombres de RPCs de lectura y si `apply_checkin` ya acepta métricas o creo `registrar_metrica`.