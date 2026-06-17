# dovo · apps nativas (iOS + Android)

Decisión del founder (16-jun-2026): **100% nativo, dos codebases separados** —
iOS en Swift/SwiftUI, Android en Kotlin/Jetpack Compose. NO Expo/React Native.

```
native/
├── ios/        # proyecto Xcode (Swift / SwiftUI)  — se compila SOLO en Mac
└── android/    # proyecto Gradle (Kotlin / Compose) — Android Studio
```

## El contrato de trabajo (importante)

- **El backend NO cambia.** Las dos apps hablan con el mismo Supabase de
  producción (proyecto `chyudsvjllcxdjgjafjo`, schema `core`, RLS + RPCs
  `SECURITY DEFINER`). La web (`~/dovo`) y las dos apps nativas son tres
  clientes del mismo backend. Cero migraciones nuevas para esto.
- **Claude escribe el código; Miguel compila y verifica.** El entorno de
  Claude (WSL/Windows) NO puede compilar Swift (necesita Mac+Xcode) ni correr
  Gradle/Android Studio. Por eso vamos por **fases chiquitas que Miguel sí
  pueda buildear y confirmar** antes de seguir — el mismo loop iterativo de la
  web, pero el compilador es Miguel.
- **iOS exige Mac con Xcode** (confirmado que Miguel tiene). Android se arma
  en Android Studio (Win/Mac/Linux).

## Lógica que NO se reescribe (vive en el backend, reusada por las 3 apps)

Las reglas de negocio con estado (cooldowns, rachas, candado, cierre de
apuestas, scoring) viven en RPCs de Postgres — las apps solo las invocan:

| Qué | Cómo lo llama la app |
|---|---|
| Registrar entreno | RPC `core.apply_checkin(...)` |
| Unirse a un grupo | RPC `core.unirse_con_token(token)` |
| Salir de un grupo | RPC `core.salir_del_trato(trato_id)` |
| Boost al compa | RPC `core.dar_boost(...)` |
| Estado del trato | RPC `core.estado_trato(...)` |
| Cancelar cuenta | RPC `core.cancelar_cuenta()` |
| La apuesta, misiones, perfil | lecturas con RLS sobre tablas de `core` |

Los cálculos PUROS (leveling, fechas CDMX, catálogo de premios, clasificador)
hoy son TS en `~/dovo/lib`; en nativo se **reescriben** en Swift/Kotlin (no se
comparten entre lenguajes). Donde la regla importe, se prefiere moverla a un
RPC para no triplicarla.

## Lo nativo de verdad (la razón de no ser web)

- **iOS:** HealthKit — leer workouts/pasos/FC/sueño → resumen a
  `core.actividad_metricas` (`fuente='apple_health'`). El enum ya existe.
- **Android:** Health Connect (`androidx.health.connect`) → mismo destino con
  `fuente='health_connect'`.
- Solo RESUMEN por check-in (distancia/duración/FC/pasos), jamás trail crudo —
  minimización ya enforced por los CHECK de la tabla. Datos de salud =
  owner-only, JAMÁS a Pulse (aviso de privacidad §6/§8).
- Push nativo (APNs / FCM).

## Plan por fases (cada fase = algo que Miguel compila y confirma)

- **Fase 0** — skeleton que arranca + auth Supabase (magic link/Google por
  deep link) + tokens/tema Mesa Nocturna + pantalla de sign-in. Meta: la app
  abre, te logueas con tu cuenta real, ves tu nombre.
- **Fase 1** — el lobby: trato (estado del dúo) + la apuesta semanal + misiones
  de hoy (solo lectura sobre `core`).
- **Fase 2** — check-in + el candado de ubicación + ceremonia (hit-stop, +pts).
- **Fase 3** — HealthKit / Health Connect → validación de entrenos.
- **Fase 4** — perfil/personaje, recompensas, duelos; push; pulido de game feel.
- **Fase 5** — EAS-less: firmar y subir a App Store / Play (Miguel, con sus
  cuentas de desarrollador).

Detalle técnico con versiones de SDK verificadas en vivo:
`docs/specs/2026-06-16-app-nativa-swift-kotlin.md`.
