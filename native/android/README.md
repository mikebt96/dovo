# dovo Android — Fase 0 (skeleton + login)

App nativa Kotlin/Compose. Meta: abre, te logueas con magic link contra tu
Supabase real, ves tu sesión. Espejo de la Fase 0 de iOS.

> **Por qué "receta" y no un proyecto que clonas tal cual:** un proyecto Gradle
> hecho a mano (AGP/Gradle/Compose tienen versiones que deben casar exacto)
> casi nunca sincroniza al primer intento y es horrible de depurar por chat.
> En cambio, el wizard de Android Studio SIEMPRE genera un proyecto que
> sincroniza, con versiones compatibles, wrapper e íconos. Así que: AS crea el
> cascarón, tú sueltas los archivos `.kt` de dovo (que es donde está el valor).
> Mismo contrato: **tú compilas, me dices qué truena.**

## Paso 1 — crear el cascarón (Android Studio)

1. **New Project → Empty Activity** (la de Compose).
2. Name: `dovo` · Package name: **`app.dovo`** · Language: Kotlin ·
   Minimum SDK: **API 26 (Android 8.0)** (lo exige Health Connect después) ·
   Build configuration: **Kotlin DSL + Version Catalog**.
3. Deja que sincronice. Esto te da AGP/Gradle/Kotlin/Compose **actuales y
   compatibles** (mejor que clavar números que se mueven). Verifica luego en
   Play que el `targetSdk` cumpla el corte vigente (a mediados 2026: API 36,
   antes 35 — el wizard suele poner el último).

## Paso 2 — dependencias (gradle/libs.versions.toml)

Agrega (versiones verificadas 2026-06-17; el BOM fija las de los módulos):

```toml
[versions]
supabase = "3.6.0"
ktor = "3.4.3"

[libraries]
supabase-bom       = { module = "io.github.jan-tennert.supabase:bom", version.ref = "supabase" }
supabase-auth      = { module = "io.github.jan-tennert.supabase:auth-kt" }
supabase-postgrest = { module = "io.github.jan-tennert.supabase:postgrest-kt" }
ktor-client-android = { module = "io.ktor:ktor-client-android", version.ref = "ktor" }
```

En `app/build.gradle.kts` → `dependencies { ... }`:

```kotlin
implementation(platform(libs.supabase.bom))
implementation(libs.supabase.auth)
implementation(libs.supabase.postgrest)
implementation(libs.ktor.client.android)   // engine obligatorio para supabase-kt
```

Y el plugin de serialización (en `plugins {}` de app, con tu versión de Kotlin):
`kotlin("plugin.serialization")`.

## Paso 3 — llaves (local.properties, gitignored)

Agrega a `local.properties` (NO se versiona):
```
SUPABASE_URL=https://chyudsvjllcxdjgjafjo.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
```
Y en `app/build.gradle.kts`, exponlas como BuildConfig (ver `build-config-snippet.kts`).

## Paso 4 — suelta los archivos dovo

Copia los `.kt` de `src/` de esta carpeta a `app/src/main/java/app/dovo/`
(respeta los subpaquetes: `core/`, `feature/`). Y mergea el deep-link de
`AndroidManifest-snippet.xml` en tu `AndroidManifest.xml`.

## Paso 5 — config de Supabase (1 vez)

Dashboard → Authentication → URL Configuration → Redirect URLs, agrega:
`io.dovo.app://login-callback` (el MISMO que iOS — un solo valor para ambas).

## Compliance Android (ver native/COMPLIANCE.md)

- **target/compileSdk 36** (corte Play 31-ago-2026; 35 sigue válido hoy).
- **Borrado de cuenta:** la URL web ya existe (`dovofit.com/eliminar-cuenta`);
  el botón in-app se añade en la fase de Ajustes.
- **Health Connect** (Fase 3): `PermissionsRationaleActivity` + `activity-alias`
  + permisos `health.READ_*` + **prominent disclosure** pre-permiso. Snippets
  exactos en `docs/specs/2026-06-17-compliance-app-stores.md` §5.

## Qué dime de vuelta

¿Sincronizó Gradle? ¿Compiló? ¿El login con magic link regresó a la app y
mostró tu correo? Pégame cualquier error y lo corrijo.
