# dovo iOS — Fase 0 (login) + Fase 1 (lobby)

App nativa SwiftUI. Tras el login (magic link) entras al **lobby**: tu
personaje (nivel, racha, los 6 stats), tu dúo y sus miembros, y la apuesta de
la semana — todo leído en vivo de tu Supabase real (solo lectura; sellar
apuesta y check-in son fases siguientes). Las columnas se verificaron contra
el schema antes de escribir los DTOs.

> Recuerda el contrato: **tú compilas y confirmas.** Esta primera compilación
> casi seguro pide algún ajuste de import/firma que solo se ve en Xcode —
> dime qué truena y lo arreglo. Es esperado en Fase 0-1 (lo dice el spec §8).

## Pasos para correrla (en tu Mac)

1. **Instala XcodeGen** (genera el `.xcodeproj` desde `project.yml`):
   ```bash
   brew install xcodegen
   ```
2. **Pon tus llaves:**
   ```bash
   cd native/ios
   cp Config/Secrets.xcconfig.example Config/Secrets.xcconfig
   ```
   Abre `Config/Secrets.xcconfig` y pega tu **anon key** (la misma
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` de la web) en `SUPABASE_PUBLISHABLE_KEY`.
   La URL ya está puesta con el truco `https:/$()/...` (no la "arregles" — el
   `$()` es a propósito, ver el comentario del archivo).
3. **Genera y abre:**
   ```bash
   xcodegen generate
   open dovo.xcodeproj
   ```
4. En Xcode (16+): selecciona un simulador o tu iPhone y **Run (⌘R)**.

## Antes de probar el login (config de Supabase, 1 vez)

En el dashboard de Supabase → **Authentication → URL Configuration → Redirect
URLs**, agrega:
```
io.dovo.app://login-callback
```
(es el mismo deep link que usará Android). Sin esto, el magic link no regresa
a la app.

## Cómo se prueba

- Corre en **iPhone físico** si puedes — los deep links del magic link son poco
  fiables en el simulador.
- Escribe tu correo → "enviar enlace mágico" → abre el correo en el teléfono →
  el enlace abre dovo → debes ver **"estás dentro ✓"** con tu email.
- Cierra y reabre la app: debe seguir logueado (sesión persistida).

## Qué dime de vuelta

- ¿Compiló? Si no, pégame el error de Xcode (esperable algún ajuste en la
  primera build — no pude compilar Swift desde mi entorno).
- ¿El login regresó a la app, y al entrar viste el **lobby** con tu personaje,
  tu dúo y la apuesta? (con la cuenta demo: demo+ivan@dovofit.com)
- Con eso confirmado, sigo con check-in + el resto, y replico el lobby en Android.

Versiones y arquitectura: `docs/specs/2026-06-16-app-nativa-swift-kotlin.md`.
