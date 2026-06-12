# dovo · brand book

Documento corto de decisiones de marca. Si está aquí, ya se decidió. Si no está aquí, conversa con Miguel antes de improvisar.

> ⚠️ **ADDENDUM GOBERNANTE (2026-06-10): "Mesa Nocturna".** Para superficies de
> JUEGO de la app, manda [`docs/specs/2026-06-10-game-design-directive.md`](docs/specs/2026-06-10-game-design-directive.md)
> (tokens de modos emocionales, motion S/M/L, HUD, ceremonias). Los tokens
> vigentes viven en `app/globals.css` — esa es la fuente de verdad de color y
> tipografía, no las tablas históricas de este documento. La voz, el naming y
> las reglas del lockup de aquí siguen siendo ley.

---

## Qué es dovo

**Un commitment device para dos.** Cualquier dúo agrega su rutina, marca rachas, y cuando alguno rompe el trato, le debe algo al otro (castigo consensuado del catálogo). Cuando ambos cumplen, se desbloquean premios reales.

No es un fitness app. Es un mecanismo de disciplina compartida con skin in the game.

---

## Para quién

dovo funciona para **cualquier 2 personas con un trato entre sí**. La lista:

- parejas (casadas o no)
- amigos
- novios / quedantes
- roommates con gym buddy pact
- hermanos accountability
- amantes (relaciones no oficiales)
- **enemigos / rivales que se quieren retar**

Esa última línea — los enemigos retándose — es el diferenciador único en categoría. Ningún competidor (OATH, Fitness Pact, Sweatmates, stickK) acknowledged rivalry como caso de uso. Todos asumen accountability "amistosa". dovo no.

---

## El nombre

```
dovo
```

**Siempre minúscula.** Nunca "Dovo", nunca "DOVO". Sin acentos. Sin variaciones.

No es acrónimo, no se deletrea. Se pronuncia *DO-vo* en español, *DOH-voh* en inglés. Idéntico spelling en ambos idiomas.

Hidden semantic (no es necesario explicarlo, pero existe): **DOS + VOTO**. Dos personas, una promesa, simétrica.

---

## Voz · lenguaje

**Coloquial MX.** Sin formalismos legales o ceremoniosos. Hablamos como hablan los usuarios cuando salen del salón.

### Palabras canon

| Sí | No |
|---|---|
| trato | ~~pacto~~ |
| reto (contexto rivalidad) | ~~compromiso~~ |
| apuesta (énfasis skin-in-the-game) | ~~juramento~~ |
| lo prometido | ~~alianza~~ |
| dúo | ~~pareja~~ (en copy genérico) |
| el otro / la otra | ~~tu compañero/a~~ |
| compartido | ~~de pareja~~ |

### Frase ancla

> **Lo prometido es deuda.**

Dicho mexicano puro. Codifica la mecánica de `pair_debts` literalmente: cuando rompes el trato, debes. Funciona para cualquier dúo (no asume romance). Es la tagline maestra.

### Otras taglines aprobadas

```
Trato hecho.
Hicimos un trato. Cuesta romperlo.
Tu palabra contra la suya.
Lo que se dijeron, se cumple — o se paga.
El trato que funciona aunque se odien.
```

---

## Visual system

### Wordmark

```
dovo
```

- Tipo: **Syne ExtraBold (peso 800)**
- Caso: lowercase, siempre
- Tracking: `-0.04em` (apretado)
- Color: `var(--color-text)` sobre dark · `#0e0d11` sobre cream

Nunca italic. Nunca outline. Nunca con drop-shadow. La tipografía es la marca; los adornos la diluyen.

### Mark

Dos discos paralelos del mismo tamaño. **No entrelazados** (eso sería wedding-ring, romántico) — paralelos = simétricos = cualquier dúo.

```
● ●
```

Geometría canónica (en `lib/brand.ts`):

```
viewBox    0 0 24 10
diámetro   10
gap        4 (edge-to-edge)
ratio      2.4 : 1
centros    (5, 5) y (19, 5)
radio      5 (solid) · 4.4 (outline, stroke 1.2)
```

Variantes:
- **Solid** (`●  ●`) — default, ink sobre cream
- **Outline** (`○  ○`) — linework, letterpress feel

**Nunca bicromático en el mark de marca.** El bicolor (cyan + pink) es para visualización de Mike + Andy como household específico, no para la marca.

### Colores

Definidos en `lib/brand.ts` (server-only) + `app/globals.css` (client tokens):

| Token | Hex | Uso |
|---|---|---|
| ink | `#0e0d11` | wordmark + mark sobre fondo claro |
| cream | `#f4ede0` | fondo de favicon, apple-icon, OG image |
| mute | `#6e6358` | tagline OG, metadata mono sobre cream |
| glassDark | `#08080a` | theme color, splash screen, BG dark |
| accent (lime) | `#c8f135` | acentos de UI, no del logo |
| role-mike | `#6bf5ff` | cyan eléctrico, perfil Mike |
| role-andy | `#ff6b9d` | rosa, perfil Andy |

### Tipografía complete

| Familia | Uso | Pesos |
|---|---|---|
| Syne | display, wordmark, headers | 400, 600, 800 |
| Space Mono | numerics, captions, mono labels | 400, 700 |
| Newsreader | italic editorial moments | 500 italic |

CSS vars: `--font-syne` · `--font-space-mono` · `--font-newsreader`.

---

## Component API

> Limpieza 2026-06-12: la librería `@/app/components/brand` descrita aquí nunca
> se construyó. El wordmark vive como texto con la clase `.syne` (AppNav) y el
> mark se dibuja inline donde se usa (GameIcon `duelo`, discos del TratoHUD).
> Si se construye la librería, recuperar la API de este doc desde el historial.

---

## Asset registry

| Path | Qué genera |
|---|---|
| `scripts/gen-icons.mjs` | genera los PNG de iconos antes del deploy |
| `public/apple-touch-icon.png` | iOS home screen (linkeado en app/layout.tsx) |
| `app/opengraph-image.tsx` | preview WhatsApp / Twitter / Slack (1200×630, estilos inline por Satori — excepción documentada) |
| `app/manifest.ts` | PWA manifest ("Add to Home Screen") |

---

## Lockup rules

### Primary (90% de los casos)

```
dovo
```

Solo el wordmark. Es la marca por sí sola.

### Compound (vistas seccionales)

```
dovo · juntos
dovo · carnet
dovo · acceso
```

Wordmark + caption mono separados por `·` (middle dot, no guión).

### Lockup completo (con mark)

```
● ●  dovo
```

Mark a la izquierda del wordmark. Para:
- Home page top bar
- Unlock screen
- About page (cuando exista)
- Social media avatar

### Mark solo (sin wordmark)

```
● ●
```

Para:
- Favicon (16/32 px)
- Apple home icon (180 px)
- OG corner badge
- Watermark editorial

**Nunca el mark sin wordmark a menos que el contexto sea tan small que el wordmark sea ilegible.** El wordmark es el ancla; el mark complementa.

---

## Antimateria · qué NO hacer

- ❌ Capitalizar el nombre: `Dovo`, `DOVO`, `DOvo`. Siempre minúscula.
- ❌ Usar acento: `dovó`, `dovò`. Sin acento.
- ❌ Italic, outline, drop-shadow en el wordmark.
- ❌ Mark entrelazado (eso es wedding rings, romántico exclusivo).
- ❌ Mark bicromático como brand mark. Mike+Andy bicolor es solo para visualización de su household específico.
- ❌ Mark solo donde el wordmark cabe.
- ❌ "pacto", "compromiso", "juramento", "alianza" en copy.
- ❌ Asumir tipo de relación en copy: "tu pareja", "tu novia", "tu compañero".
- ❌ "Couple Pro" como tier name (renombrado a "Dúo Pro").
- ❌ Inglés clinical: "commit", "wager", "stake" en copy en español.

---

## Posicionamiento vs competencia

| App | Mecánica | Idioma | Acknowledged rivalry |
|---|---|---|---|
| OATH (theoathapp.com) | commitment contract + GPS + SMS partner | EN | no |
| Fitness Pact | pact + wager + couples | EN | no |
| Sweatmates | weekly wager simple | EN | no |
| stickK | financial stakes + anti-charity | EN | no |
| **dovo** | dúo simétrico, ambos riesgan y premian | **ES MX** | **sí — incluso enemigos** |

Diferenciadores duros:
1. Lenguaje español MX-first (todos los demás en inglés clinical)
2. Pricing per-dúo ($139 MXN/mes), no per-user
3. Rivalry/enemy framing como caso de uso explícito
4. Multi-deporte (gym, ballet, pilates, running, swimming, cycling, etc.)
5. Castigos catalog consensuado (no solo financial stakes)

---

## Dominio · TLD strategy

- `dovo.com` → DOVO Solingen razors (alemán, desde 1906, no se mueve). Aceptado.
- `dovo.app` → SaaS B2B de sales intel. Coexistencia OK (otra audiencia, otro vertical). Verificar trademark Class 9 antes de marketing público.
- `dovo.mx` → **primary recommended**. MX-first, encaja con pricing en MXN, signal local.
- `getdovo.com` / `hidovo.com` → fallback solo si necesitas .com para SEO/redes.

---

## Referencias en código

| Archivo | Qué define |
|---|---|
| `lib/brand.ts` | `COLOR` tokens, `MARK` geometry (server-only) |
| `app/components/brand.tsx` | `Mark`, `Wordmark`, `Logo` components (client) |
| `app/globals.css` | CSS vars para colores client-side |
| `app/layout.tsx` | metadata global + openGraph defaults |

## Referencias en memoria de Claude

| Memory file | Contiene |
|---|---|
| `project_dovo.md` | Decisión de nombre + posicionamiento + dominios |
| `feedback_dovo_lenguaje.md` | Reglas de lenguaje (no "pacto", etc.) |

---

*Última actualización: 2026-06-16. Si algo de aquí ya no aplica, edita el archivo y commit.*
