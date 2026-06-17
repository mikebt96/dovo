# Compliance nativo — qué está en código y qué configura Miguel

Requisitos de App Store + Play **incorporados** a las apps. Detalle y fuentes:
`docs/specs/2026-06-17-compliance-app-stores.md` (checklist) y la guía de
incorporación (research en vivo 2026-06-17). Reglas de tienda se mueven:
re-verificar antes de cada submit.

## Decisión de auth (clave para Apple 4.8)

La regla 4.8 (Sign in with Apple obligatorio si ofreces login social de
terceros) se dispara **por app**. La app **iOS usa SOLO magic link de email
(first-party) — sin Google** → **4.8 NO se dispara → Sign in with Apple NO es
necesario**, y evitamos la Edge Function de revocación de token de Apple. Si
algún día se agrega Google a iOS, ENTONCES hay que añadir Sign in with Apple +
revocación REST (`appleid.apple.com/auth/revoke`) en el borrado de cuenta.
(Android sí puede llevar Google + magic link sin Sign in with Apple — Google
Play no exige el equivalente.)

Scheme de deep link unificado en ambas apps: **`io.dovo.app://login-callback`**
(registrar UNA vez en Supabase → Auth → URL Configuration → Redirect URLs).

## iOS

| Requisito | Estado | Dónde |
|---|---|---|
| Privacy Manifest (`PrivacyInfo.xcprivacy`) | ✅ EN CÓDIGO | `ios/Sources/PrivacyInfo.xcprivacy` (tracking=false + UserDefaults CA92.1); referenciado en `project.yml` como resource |
| Sin ATT (no tracking) | ✅ por diseño | no se incluye el framework; manifest tracking=false |
| Sign in with Apple (4.8) | ✅ NO aplica | iOS es magic-link-only (ver decisión arriba) |
| Borrado de cuenta in-app (5.1.1/v) | ⏳ falta pantalla | el RPC ya purga todo+auth+sesiones; falta el botón nativo (fase de Ajustes) + link a `/eliminar-cuenta` |
| HealthKit usage strings | ⏳ Fase 3 | al integrar HealthKit: `NSHealthShareUsageDescription` en Info.plist (sin ella la app CRASHEA). Texto en el checklist §5 |
| Privacy policy URL | ✅ existe | `dovofit.com/privacidad` (Miguel la pega en App Store Connect) |
| App Privacy label | ▢ MIGUEL | App Store Connect, tabla 6A del checklist (Health/Fitness JAMÁS bajo advertising) |

## Android (al scaffoldear y antes de subir)

| Requisito | Estado | Dónde |
|---|---|---|
| target/compileSdk 36 (corte Play 31-ago-2026; 35 también válido hoy) | ⏳ scaffold | `libs.versions.toml` |
| Borrado de cuenta in-app + URL web | ✅ URL / ⏳ in-app | web `/eliminar-cuenta` ya existe; falta botón nativo |
| Health Connect: `PermissionsRationaleActivity` + `activity-alias ViewPermissionUsageActivity` | ⏳ al integrar salud | snippet exacto en checklist §5 / guía §4 (misma privacy URL) |
| Permisos `android.permission.health.READ_*` | ⏳ al integrar salud | manifest; declarar solo los que se usen |
| Prominent disclosure pre-permiso (Why/What/How, consentimiento afirmativo) | ⏳ al integrar salud | pantalla nativa propia, ANTES del diálogo de permisos |
| Deep link auth (`io.dovo.app://login-callback`) | ⏳ scaffold | intent-filter en MainActivity + `install(Auth){scheme/host}` |
| Data Safety form (incl. URL de borrado) | ▢ MIGUEL | Play Console, tabla 6B del checklist |
| Health Apps Declaration | ▢ MIGUEL | Play Console, al integrar Health Connect |

## Lo que configura Miguel en consolas (resumen)

- **Supabase → Auth → Redirect URLs:** agregar `io.dovo.app://login-callback`.
- **App Store Connect:** App Privacy label (checklist 6A), URL de privacidad, NO activar ATT.
- **Google Play Console:** Data Safety (6B) con la URL `dovofit.com/eliminar-cuenta`, Health Apps Declaration (al subir salud), URL de privacidad.
- **Aviso de privacidad:** completar el domicilio fiscal (marcador en §1).
- (Solo si algún día se agrega Google a iOS) Apple Developer: App ID con capability Sign in with Apple + Key `.p8` para la revocación.

✅ en código · ⏳ código pendiente por fase · ▢ tarea de consola de Miguel
