# dovo · directiva del consejo de videojuegos (junio 2026) — REV. AUDITADA

**Documento ejecutable. Un ingeniero debe poder implementarlo sin volver a preguntar.**
**Cada cambio fue verificado contra el repo (`~/dovo`). Las correcciones de factibilidad van marcadas [AJUSTE: …].**

### Arbitrajes del director (contradicciones resueltas)

1. **Color de la racha: ámbar, no violeta ni teal.** Gana ámbar — pero [AJUSTE: el #b86a10 propuesto da 3.7:1 sobre `#f4f4f6` y FALLA AA en texto pequeño; el token light queda en `#8f5a00` (≈5.3:1 AA ✓), dark `#ffb454`]. La racha SIEMPRE del mismo token, en toda la app.
2. **Icono de racha: dos eslabones, no llama.** Sin cambios.
3. **Color rival: rojo dedicado, no magenta FLE.** Sin cambios de fondo — verificado: hoy el rival usa `text-stat-flex` en DuelScoreboard:115. [AJUSTE: `#ff3d5e` da 3.3:1 sobre papel claro; se añade `--color-rival-deep #c2103a` (≈5.6:1) para TEXTO sobre claro, mismo patrón que el `--c-signal-deep` existente. Sobre panel oscuro `#ff3d5e` pasa (≈5.5:1).]
4. **canvas-confetti: autorizada como ÚNICA micro-dep nueva.** `import()` dinámico, `useWorker:true`, `disableForReducedMotion:true`, `particleCount ≤ 80`, SOLO capa L.
5. **Un solo widget de estado en home: TratoHUD** (fusión DuoPulse + PactoMeter + PactoSemanal + TratoHUD).
6. **Deuda como mecánica → P2-top; Veredicto v1 (solo racha) → P1.** Queda MANDATADA.
7. **`.btn-game` toma el color del contexto.** Sin cambios.
8. **Bottom nav: 64px, 5 tabs, nombre canónico `BottomHUD`.** Sin cambios.
9. **Claves del payload: las canónicas del repo son `fue/res/flex/vel/equ/vit`.** [AJUSTE: el arbitraje original escribió `fle` — INCORRECTO. `StatKey = "fue"|"res"|"flex"|"vel"|"equ"|"vit"` en `lib/scoring/types.ts:1`, columna `user_character.flex` en DB, var CSS `--stat-flex`, clase `bg-stat-flex`. Gana `flex` en TS/DB/CSS; "FLE" queda solo como LABEL visual (así lo hace ya CharacterCard).]

---

## 1. Tesis estética

**Nombre del lenguaje visual: "Mesa Nocturna"** (evolución de Ultraviolet — el papel editorial de día, el casino del trato de noche).

1. dovo es una mesa de apuestas nocturna: el chrome (nav, fondos, forms) permanece editorial, desaturado y calmado — piano-glass — y TODO el color saturado y el movimiento se concentran exclusivamente en lo que está en juego: números, barras, cartas, golpes, ceremonias.
2. El backend ya es un videojuego; la UI imprime sus recibos: cada acción devuelve botín legible (qué compró tu sudor), cada recurso tiene un icono + un color + un lugar fijo, y cada momento raro (level-up, Veredicto, W/L) se celebra a la escala que se ganó — gating estricto: si todo es jackpot, nada lo es.
3. La marca es el personaje: los dos discos del mark respiran cuando el dúo cumple, saltan en el éxito, se sacuden al recibir golpe y se escarchan congelados; "lo prometido es deuda" deja de ser tagline y se vuelve interfaz — pacto que pulsa, cinta de deuda, Veredicto del Domingo.

---

## 2. Sistema de tokens

[AJUSTE GLOBAL: poner hex estáticos dentro de `@theme` NO reacciona al tema. El patrón del repo (globals.css L19–94) es: raw vars en `:root` + override en los dos bloques dark + mapeo `@theme inline`. Los tokens nuevos siguen EXACTAMENTE ese patrón. Además, el repo ya usa `color-mix(in srgb, …)` (anim-shield-flash L184) — todo color-mix nuevo usa `in srgb` por consistencia y soporte.]

El violeta `#6d4aff` existente queda como **"la casa"**: identidad, navegación, XP, nivel. Prohibido usarlo para recursos.

```css
/* ── Raw vars en :root (light) — añadir junto a --c-signal etc. ── */
:root {
  /* modos emocionales — el chrome JAMÁS los usa */
  --mode-coop: #3ac49a;        /* pacto: boost, escudo, quest coop (= stat-equ: el teal YA es escudo en anim-shield-flash) */
  --mode-coop-deep: #177a5c;   /* texto coop sobre papel claro (AA ≈4.8:1) */
  --mode-rival: #ff3d5e;       /* duelo, ataque, deuda — gráficos y panel oscuro */
  --mode-rival-deep: #c2103a;  /* texto rival sobre papel claro (AA ≈5.6:1) */
  --mode-gold: #f0c75a;        /* ceremonia: level-up, milestone, grado S (solo sobre panel oscuro) */
  --mode-racha: #8f5a00;       /* racha del trato sobre papel claro (AA ≈5.3:1) */
}
/* ── Override dark: replicar en AMBOS bloques dark existentes (media query L59 y [data-theme="dark"] L79) ── */
/*    --mode-coop: #4adfb2; --mode-coop-deep: #4adfb2;
      --mode-rival: #ff5c77; --mode-rival-deep: #ff8094;
      --mode-gold: #f0c75a;  --mode-racha: #ffb454;          */

@theme inline {
  --color-coop: var(--mode-coop);
  --color-coop-deep: var(--mode-coop-deep);
  --color-rival: var(--mode-rival);
  --color-rival-deep: var(--mode-rival-deep);
  --color-gold: var(--mode-gold);
  --color-racha: var(--mode-racha);
}

@theme {
  /* ── LÉXICO DE RECURSOS — 1 recurso = 1 color + 1 icono + 1 lugar, SIEMPRE ── */
  /* [AJUSTE: aliasear a las raw vars --stat-* (theme-reactivas), no a --color-stat-*] */
  --color-ammo: var(--stat-vit);     /* lima · munición */
  --color-shield: var(--mode-coop);  /* escudo (regalo del pacto) */
  --color-freeze: var(--stat-vel);   /* cyan · congelamiento */

  /* ── SUPERFICIE DE JUEGO ── */
  --surface-game: radial-gradient(130% 150% at 12% 0%, #16132a 0%, #0b0a14 55%, #07060d 100%);
  --shadow-game: 0 24px 60px -28px rgba(109, 74, 255, 0.55);
  --radius-game: 20px;   /* cards de juego */
  --radius-chip: 10px;   /* chips de recurso/estado */
  /* pills editoriales siguen rounded-full: esa separación ES la jerarquía */

  /* ── MOTION ── */
  --ease-out:  cubic-bezier(0.16, 1, 0.3, 1);     /* la house curve (ya usada en anim-*), formalizada */
  --ease-snap: cubic-bezier(0.2, 0.8, 0.2, 1);    /* barras, reveals */
  --ease-back: cubic-bezier(0.34, 1.56, 0.64, 1); /* overshoot ~10%: SOLO transform */
  --t-tap: 90ms; --t-fast: 180ms; --t-base: 240ms; --t-exit: 190ms; --t-celebr: 900ms;
}

/* --ease-spring: linear(...) generado en kvin.me/css-springs (stiffness 180, damping 12),
   declarado bajo @supports (animation-timing-function: linear(0, 1));
   fallback automático = --ease-back */
```

[NOTA DE FACTIBILIDAD: Tailwind instalado = **4.3.0 estable** (el package.json dice `^4.0.0-beta.5` pero el lockfile resolvió estable) → `@utility`, `@theme inline` y namespaces `--radius-*`/`--shadow-*`/`--ease-*` funcionan. Aprovechar: `rounded-game`, `shadow-game`, `ease-snap` salen gratis como utilities.]

**Utilities nuevas** (en `globals.css`, `@utility`):

```css
@utility card-game {
  background: var(--surface-game);
  box-shadow: var(--shadow-game);
  border-radius: var(--radius-game);
}
/* [AJUSTE: las copias inline del panel oscuro son ~10, no 7: CharacterCard, DuoChampion,
   home-authed (héroe), DuelScoreboard, ProBadge, ShowcaseCharacterCard, recompensas/page,
   nutricion/page, admin/page, ScanFlow. EXCLUIR app/opengraph-image.tsx: el renderer OG
   exige estilos inline — esa copia se queda.] */

@utility btn-game { /* la física de Brawl Stars sin su paleta */
  background: var(--btn-color, var(--c-signal));
  border-radius: 14px;
  box-shadow: 0 5px 0 color-mix(in srgb, var(--btn-color, var(--c-signal)), black 35%);
  transition: translate 80ms ease-out, box-shadow 80ms ease-out;
  &:active {
    translate: 0 4px;
    box-shadow: 0 1px 0 color-mix(in srgb, var(--btn-color, var(--c-signal)), black 35%);
  }
}
/* al soltar: rebote translate 0 0 con --ease-back 250ms. SOLO en acciones de juego:
   quickLog, golpe/congelar, aceptar reto, dar boost, reclamar recompensa */

@utility tape-rival { /* cinta de peligro: deuda y superficies de ataque */
  background-image: repeating-linear-gradient(45deg,
    color-mix(in srgb, var(--mode-rival) 18%, transparent) 0 8px, transparent 8px 16px);
}
```

**Anillos de tier** (tokens `--tier-ring-*`, aplicados a chips/barras, nunca full-card):
- Rookie: `border: 1px solid rgba(255,255,255,0.12)`
- Apprentice/Athlete: `border: 2px solid var(--stat)` (color al 70%)
- Expert: `border: 2px solid var(--stat)` + `filter: drop-shadow(0 0 12px color-mix(in srgb, var(--stat) 40%, transparent))`
- Master: foil — `border-image: linear-gradient(120deg, var(--stat), #fff 30%, var(--stat) 60%)` con background-position animado 8s
- Legend: borde cónico — wrapper padding 2px, `background: conic-gradient(from var(--angle), var(--stat), #fff, var(--stat))` rotando 6s vía `@property --angle` (paint acotado a chips de 48–96px; reduced-motion: gradiente fijo)
- Prestige/Immortal: `filter: invert(1) hue-rotate(180deg)` solo en el chip del número de nivel

**Tipografía de números:** Geist weight 800–900, `font-variant-numeric: tabular-nums` OBLIGATORIO en todo número de juego (el repo ya usa la clase `tabular-nums` — generalizar). Glow por temperatura: `text-shadow: 0 0 28px color-mix(in srgb, var(--modo) 55%, transparent)`. **Eliminar Inter y JetBrains Mono** [AJUSTE: viven en el `<link>` de Google Fonts en `app/layout.tsx` L58 (no next/font) — es editar esa URL dejando Geist, Geist Mono y Syne].

**Grain:** [AJUSTE: `Grain.tsx` es un overlay `fixed inset-0 z-[60]` de viewport completo — NO se puede "excluir" por card. Resolución: (a) los `<dialog>` modales van al top layer del navegador y quedan limpios GRATIS; (b) `BottomHUD` se monta con `z-[70]` (encima del grain); (c) sobre paneles `.card-game` el soft-light al 4.5% es prácticamente invisible — se acepta. No tocar Grain.]

---

## 3. Sistema de motion

**Reemplazar el comentario "F10 · Animaciones globales (editorial, sutiles)" de `globals.css` L159 por este contrato** (y documentarlo en `docs/specs/DESIGN.md`, sección "Juice budget"). [VERIFICADO: el comentario está exactamente en L159; los keyframes existentes anim-pop/shake/frost/shield-flash/float-away/bar-w/bar-h se CONSERVAN y se reutilizan.]

### Matriz de gating S/M/L

| Capa | Presupuesto | Eventos | Tratamiento |
|---|---|---|---|
| **S** | <400ms, inline, **0 partículas** | check-in normal, log de ejercicio, dar/recibir boost (chip), copiar cupón | float `+N pts`, anim-pop, chips de delta por stat |
| **M** | 600–1200ms, dentro del card, **≤20 partículas DOM** | tier-up de stat, golpe conectado/recibido, racha semanal +1, recompensa lista, subir posición en leaderboard | flash del color del stat, overshoot `scaleX 1→1.04→1`, shake del card (solo impactos) |
| **L** | 1.5–2.5s, takeover `<dialog>`, confetti canvas ≤80, **máx 1 por visita** | level-up, tier Master/Legend, W/L de duelo, milestone de racha (4/8/12/24/52), Veredicto del Domingo, pacto sellado, deuda saldada | ceremonia completa (abajo), skippable a un tap; si coinciden dos L se encadenan en el mismo dialog, nunca dos seguidas |

### El hit-stop de 90ms (firma física de dovo)
Todo impacto (check-in registrado, golpe conectado, level-up) congela la UI 90ms **entre la respuesta del server y la reacción visual** [AJUSTE: el round-trip del server action ya toma 100–600ms; el hit-stop es: al llegar `res.ok`, el botón se mantiene en pressed 90ms más (`setTimeout`) y LUEGO se suelta TODO el feedback junto: float + flash + buzz + sonido]. Es un setTimeout y es la diferencia entre "toast de guardado" y "golpe que se siente en la mano".

### Anatomía de toda ceremonia L
`<dialog>.showModal()` + `@starting-style { scale: 0.8; opacity: 0 }` + `transition-behavior: allow-discrete` [AJUSTE: Safari <17.5 ignora @starting-style → el dialog aparece sin animación de entrada con el dato y el CTA intactos; fallback funcional aceptado]:
1. **Anticipación** 350ms — `::backdrop` sube a `rgba(7,6,13,0.85)`, estado viejo en pantalla
2. **Hit-stop** 80ms
3. **Clímax** — número nuevo entra `scale(3)→1` con `--ease-back` 500ms + count-up + partículas (DOM en level-up, confetti canvas en victoria) + `buzz([40,40,90])`
4. **Settle** 400ms — estado nuevo + CTA ("presumir" / "revancha")

Total ≤2.5s. Secuenciar con WAAPI y `await animation.finished`.

### Reglas duras
- Overshoot (`--ease-back`/`--ease-spring`) SOLO en `transform`, jamás en color/opacity.
- Barras nuevas con `transform: scaleX` (compositor), nunca `width`. [AJUSTE: las barras actuales animan `width`/`height` (anim-bar-w/h, StatBar, CharacterCard) — se migran a scaleX AL tocarlas, no en un barrido aparte.]
- Shake SOLO para impactos recibidos — jamás en eventos positivos ni en derrotas (derrota = desaturación `grayscale(0.6)`, no shake).
- Exits 20% más rápidos que entradas (`--t-exit`).
- Máx 1 animación perpetua ("respiración") por viewport.
- [AJUSTE — presupuesto de blur: máx DOS backdrop-filter fijos simultáneos; al entrar el BottomHUD (blur 12px), la top bar adelgazada baja de `backdrop-blur-xl` a `backdrop-blur-sm` (8px) o se vuelve opaca en móvil.]

### Háptica (en `lib/juice.ts`, P2 el archivo, P0 el patrón inline)
`buzz = (p) => navigator.vibrate?.(p)` — Android-only: 12ms check-in, 15ms golpe lanzado, 60ms golpe recibido, `[40,40,90]` level-up/victoria. iOS no vibra jamás: nunca diseñar dependiendo de la háptica (el golpe se comunica con shake+flash).

### Sonido (P2, opt-in)
AudioContext singleton con `resume()` en primer tap; OscillatorNode, cero assets: blip 880Hz/60ms sine (check-in), sweep 220→110Hz/120ms (golpe recibido), arpegio 523-659-784Hz (level-up). Pitch aleatorio ±8%. Toggle en /ajustes, **default OFF**. El audio nunca es el único canal de feedback.

### prefers-reduced-motion
Estado final estático con el feedback **informativo intacto**: los deltas aparecen 2s y se van con fade, dialogs estáticos con el dato y el CTA, ghost bars saltan al valor final, confetti deshabilitado. EXCEPCIÓN: el hundimiento de `.btn-game` se mantiene (es feedback de input, no decoración). [El patrón ya existe en el repo: base fuera del media query, animación dentro — seguirlo.]

---

## 4. Componentes nuevos o rediseñados

**0. Payload de juego — `crearCheckin` (PRERREQUISITO DE TODO).** Cambiar el retorno de `{ puntos }` a:
```ts
{ puntos: number, boostAplicado: boolean,
  deltas: Record<'fue'|'res'|'flex'|'vel'|'equ'|'vit', number>,  // [AJUSTE: 'flex', la clave canónica real]
  nivelAntes: number, nivelDespues: number, xpParaSiguiente: number,
  tierUps: Array<{ stat: StatKey, de: string, a: string }>,
  rachaPersonal: number,            // user_streak (la PERSONAL, no la del trato)
  municionLista: boolean }          // true: este check-in ES la munición de hoy (regla en getDuelContext)
```
[AJUSTE — implementación real verificada: `core.apply_checkin` **YA devuelve `core.user_character`** (el estado after, con deltas boosteados aplicados) y `crearCheckin` hoy lo descarta (`const { error } = await …rpc(…)`). El flujo correcto es: (1) leer `user_character` BEFORE (1 query); (2) leer si hay boost `energia` vigente no aplicado — el RPC lo consume incondicionalmente si existe, así que su existencia ⇒ `boostAplicado` (1 query, mismo patrón que `getBoostActivo`); (3) llamar el RPC **capturando `data`** = AFTER; (4) `characterSheet(before)` vs `characterSheet(after)` en TS ⇒ nivelAntes/Después, xpParaSiguiente, tierUps; `deltas` reales = after − before por stat (captura el boost); (5) leer `user_streak.current_streak_weeks` ⇒ rachaPersonal (1 query). Son ~3 lecturas ligeras + el RPC, cero round-trips extra al cliente.] Sin esto, level-up, tier-up y racha son invisibles **por construcción**.
→ `lib/actions/checkins.ts`, `lib/leveling/*` (solo lectura, ya expone todo)

**1. CheckinRow v2 — el recibo de esfuerzo.** [VERIFICADO: ya es `"use client"` — todo lo de abajo es viable sin tocar la arquitectura.] Al `res.ok`: (1) hit-stop 90ms con botón pressed; (2) soltar todo junto: `+N pts` a text-2xl con `scale(clamp(1, 1 + pts/1000, 1.25))` estilo Balatro, float-away 900ms (reusar anim-float-away); (3) chips de delta `+12 FUE` cada uno en su `var(--stat-*)` con `bg: color-mix(in srgb, var(--stat) 12%, transparent)`, stagger 60ms, 700ms [AJUSTE: mapa estático de clases por StatKey con `flex` incluido, como el `BAR_CLASS` de StatBar — Tailwind no puede purgar clases dinámicas]; (4) si `boostAplicado`: etiqueta inline `+40 boost · solo personaje` en `--color-coop-deep` sobre claro; (5) `buzz(12)`; (6) si `tierUps` o `nivelDespues > nivelAntes` → escala a LevelUpDialog (no suma efectos aquí); (7) si `municionLista` → pop del chip de munición en el HUD. Botón = `.btn-game` signal. Todo copy nuevo a `messages/es.json` + `en.json`.
→ `app/_components/CheckinRow.tsx`, keyframes en `globals.css`

**2. XPBar / StatBar de dos capas — la barra fantasma.** Patrón "provisional damage": fill principal salta al valor nuevo con `--ease-spring` 450ms; detrás, ghost bar del mismo color al 25–30% de opacidad que drena con delay 400ms y transición 800ms linear. [AJUSTE: StatBar y CharacterCard son **server components** — la ghost bar necesita estado de cliente. Crear `StatBarLive.tsx` (client island) que recibe `value` como prop y guarda el valor previo en estado: React PRESERVA el estado de client components a través de `router.refresh()`, así que la animación old→new funciona con el flujo actual de CheckinRow. El StatBar server actual se queda para vistas estáticas (leaderboard).] Aplicar a la barra de XP (que SE MUEVE A LA HOME, al CharacterCard — hoy solo existe en /perfil como línea h-1) y a las 6 barras de stats al llegar deltas. Al cruzar tier: flash `box-shadow: 0 0 0 4px color-mix(in srgb, var(--stat) 40%, transparent)` 600ms + el label del tier sube de `text-[9px] white/30` a `text-[11px]` mono al 100% con anim-pop. Barras con `scaleX`, no width.
→ nuevo `app/_components/StatBarLive.tsx`, `CharacterCard.tsx`, reusar en `/perfil`

**3. LevelUpDialog — la ceremonia L.** Client island con la anatomía de §3. Clímax: número de nivel entra `scale(3)→1`, count-up, burst de 16–20 partículas DOM (spans, transform/opacity, signal). Settle: clase/tier nuevo + CTA "presumir" (share card). Tier-up a Master/Legend usa la misma ceremonia con el color del stat. Disparado desde CheckinRow con el payload (los datos vienen del action, no hay query extra). Gating: máx UNA por visita; level-up + tier-up coincidentes se encadenan en el mismo dialog.
→ nuevo `app/_components/LevelUpDialog.tsx`

**4. BottomHUD — AppNav → HUD.** Matar los 7 links mono de 9px con overflow-x-auto [VERIFICADO: AppNav.tsx L42]. Tab bar fija: `position: fixed; bottom: 0`, height 64px + `env(safe-area-inset-bottom)`, `background: rgba(7,6,13,0.85)` + `backdrop-filter: blur(12px)`, `border-top: 1px solid rgba(255,255,255,0.08)` — **siempre nocturna, incluso en light pages**. [AJUSTE: `z-[70]` — encima del Grain (z-60).] 5 tabs: hoy / duelo / tabla / premios / perfil (nutrición vive en "hoy" con su FAB — FoodFab.tsx ya existe; ajustes migra a perfil). Icono SVG 24px + label mono 9px; activo = filled + dot 4px violeta.
[AJUSTE CRÍTICO DE MONTAJE: la home `/` vive **FUERA** del route group `(app)` — `app/page.tsx` renderiza `HomeAuthed` directo. BottomHUD montado solo en `app/(app)/layout.tsx` NO aparecería en el lobby. Solución: BottomHUD es client island con `usePathname()` para el tab activo, montado en DOS puntos: `app/(app)/layout.tsx` y `home-authed.tsx`. Los datos de badges los fetchea un server wrapper (`BottomHUDServer`) usado en ambos.]
**Badges de juego:** chip de munición permanente (lleno lima + `box-shadow: 0 0 10px var(--color-ammo)` si entrenaste hoy; `grayscale(1) opacity .4` si no — query de check-in HOY CDMX, mismo cálculo que getDuelContext); hexágono `--color-shield` si traes escudo (getBoostActivo tipo escudo); badge 16px `--color-rival` con count y anim-pop si recibiste ataque <24h [AJUSTE: no existe estado "visto" en DB — v1: "<24h" + dismiss en localStorage; tabla `ataques_vistos` solo si duele]; dot `--color-freeze` si estás congelado (query ataques `para_user=yo`, `congela_hasta > now()`); dot signal en "premios" si hay recompensa sin reclamar. `aria-label` con el conteo real. Top bar se adelgaza a 48px: mark + StreakChip + ajustes/tema [AJUSTE: y baja a `backdrop-blur-sm` u opaca — presupuesto de blur de §3]. Layout: `padding-bottom: calc(80px + env(safe-area-inset-bottom))` en main [AJUSTE: cada página tiene su propio `<main>` — aplicarlo vía clase compartida].
→ nuevos `app/_components/BottomHUD.tsx` (+ wrapper server), `AppNav.tsx` (adelgazar), `app/(app)/layout.tsx`, `home-authed.tsx`, labels nuevos en `messages/*`

**5. TratoHUD — el estado del trato abre la home** (fusión DuoPulse + PactoMeter + TratoHUD). [AJUSTE DE DATOS: los check-ins del compa SÍ son legibles (policy `checkins_read_comembers` verificada), pero `user_rutinas` es **owner-only** (`rutinas_owner_all`) — la frecuencia de la rutina del compa NO es legible desde el cliente. Se REQUIERE una RPC SECURITY DEFINER nueva: `core.estado_trato(p_trato_id)` gated por `core.is_trato_member`, que devuelve por miembro `{ user_id, nombre, freq_objetivo, checkins_semana, checkin_hoy }` (reusa la lógica de `compliance_miembro`). Migración pequeña, P1 junto con el componente.] Server component (shell) ARRIBA del héroe con islands para lo que tickea:
- (a) **DuoPulse**: los dos discos del mark a 28px — lleno violeta + dv-breathe (3.6s, desfase 1.8s) si ese miembro ya hizo check-in HOY; hueco (`border 1.5px ink/25, grayscale(.8)`) si no. Label mono 11px: "tú ✓ · ana aún no". Tap en disco pendiente → nudge pre-escrito (vía `sendPushToComembers`, que ya existe), máx 1/día [AJUSTE: rate-limit v1 en localStorage + tag de push; sin tabla nueva], con confirmación. dv-breathe se porta de `landing.css` a `globals.css` (es transform-only, compatible).
- (b) **Compliance semanal**: dos filas (tú / tu compa), N segmentos = `freq_objetivo` de la RPC (pills 6–8px, llenas signal, vacías `border-ink/15`) + contador `2/4` tabular-nums.
- (c) **Racha del trato**: chip eslabones + número, SIEMPRE `--color-racha`. [AJUSTE: esta es `core.trato_streak` (la del Veredicto) — NO confundir con la racha personal de `user_streak` que hoy muestra CharacterCard.]
- (d) **Countdown al Veredicto**: "el trato se juzga en 2d 14h" (domingo 23:59 CDMX, tick 1 min — client island, tabular-nums).
- Estados: al-día (signal pleno) / **en-riesgo** (faltan más check-ins que días, o jueves+ con ≥2 pendientes): racha en `grayscale(.8)` + pulso opacity 0.75↔1 a 2.4s + copy "la racha del trato está en riesgo — aún están a tiempo" (jamás push de culpa) / rota (gris estática + CTA "duelo de regreso"). Escudo en mano: chip "escudo activo · 5d". Deuda pendiente (P2): cinta `tape-rival` de 8px arriba + chip persistente.
- [AJUSTE: todo el copy MX nuevo ("no me dejes morir solo, compa", etc.) va a `messages/es.json` + `en.json` — soporte es/en es invariante.]
→ nuevo `app/_components/TratoHUD.tsx`, `home-authed.tsx`, migración `estado_trato`, `messages/es.json`/`en.json`

**6. AttackPanel v2 — consola de combate.** [VERIFICADO: ya es client; getDuelContext ya entrega `municion`, `yaAtacoHoy`, `congelados` PRE-tap — los estados pre-tap son viables hoy.] Contenedor con `clip-path: polygon(0 0, 100% 2%, 99% 100%, 1% 97%)` y header `tape-rival` — **nada rival está a 90°**. Botones golpe/congelar: `.btn-game` con `--btn-color: var(--mode-rival)`, 100% width, height 52px, icono SVG propio. **Revelado del escudo con tensión** (la slot machine ética de dovo): tap → hit-stop 90ms (silencio total) → tensión 700ms: wobble de la carta rival (`rotate −1.2°↔1.2°`, 350ms ×2) → revelado: conectado = shake del DuelScoreboard ±5px + `−10` en text-3xl font-black con glow rival + float-away 900ms + count-up del marcador rival hacia abajo + `buzz(15)`; bloqueado = anim-shield-flash (ya existe) + copy "traían escudo, compa — se consumió el suyo". Nunca >800ms de espera. **Estados pre-tap, jamás post-tap**: sin munición = botón apagado grayscale + "entrena hoy para cargar tu golpe"; ya atacaste = [AJUSTE: el límite es 1 ataque por día CDMX (`yaAtacoHoy`), NO un cooldown de 14h — el copy correcto es "tu golpe se recarga a medianoche" con countdown a medianoche CDMX, mono tabular]; los P0001 del RPC siguen llegando como mensajes crudos post-tap [VERIFICADO en lanzarAtaque] — con los estados pre-tap correctos el P0001 queda solo como red de seguridad, nunca como sorpresa esperada. Munición = slot tipo cargador: disco 16px lleno lima ("tienes 1 golpe · expira a medianoche" — VERIFICADO: la munición ES el check-in de hoy CDMX, expira a medianoche de verdad) / hueco dashed ("entrena hoy para cargarlo"). Congelamiento: chip countdown real desde `congela_hasta` (existe en DB) — "descongela en 7h 12m", mono tabular, refresh por minuto + anim-frost (ya existe).
→ `app/(app)/retos/_components/AttackPanel.tsx`, `DuelFeed.tsx`, `globals.css` (wobble, clip utilities)

**7. DuelScoreboard v2 — dos lados, dos temperaturas.** [VERIFICADO: client component; useCountUp ya dentro; rival hoy en `text-stat-flex` — ese es el bug de color que este cambio mata.] Tu número con glow violeta, rival con glow `--mode-rival`. El "vs" al 30% muere: lo reemplaza el **diferencial vivo** ("+23") al 100% en chip diagonal `rotate(-8deg)`, animado con useCountUp. Barra de ventaja central h-2: dos `scaleX` enfrentados desde el centro (`transform-origin` left/right), violeta vs rojo, transición 700ms `--ease-snap`. "Vas perdiendo" (margen ≥10%): tu lado `grayscale(0.4–0.6)` + línea mono 11px sin eufemismos ("vas abajo por 23" / "te están comiendo, muévete" — a messages/*). "Vas ganando": pulso sutil del glow (opacity 0.45↔0.6, 3s). Head-to-head persistente "van 3–2" sobre el marcador [AJUSTE: el índice único `retos_par_vivo_idx` es solo del par VIVO; el head-to-head es una query normal al histórico de `core.retos` por par — la RLS de party la permite y los índices `retos_trato_a/b_idx` existen]. Miembro congelado: anillo `conic-gradient(var(--color-freeze) var(--p), transparent 0)` de 20px que se consume hacia 0 vía `@property --p` + countdown.
→ `app/_components/DuelScoreboard.tsx`, `lib/actions/retos.ts` (head-to-head)

**8. DuelResultDialog — ceremonia W/L.** Nadie gana una guerra de 7 días con un `router.refresh()`. Takeover `<dialog>` al primer open tras el cierre [AJUSTE: "visto" en localStorage por reto_id — sin tabla]: letter grade S/A/B según margen (S >30%, A 10–30%, B <10%) o "GANARON/PERDIERON" en `clamp(72px, 20vw, 140px)` weight 900 con `-webkit-text-stroke 2px` (`--mode-gold` victoria / `--mode-rival` derrota), entrada `scale(3)→1` `--ease-back` 500ms; count-up del marcador final 800ms; head-to-head. Victoria: confetti canvas (la micro-dep). Derrota: **NO shake, CERO burla** — `grayscale(0.6)` del marcador + el castigo del trato en primer plano ("lo prometido es deuda"). CTAs: **revancha** (pre-llena reto contra el mismo dúo — obligatorio si margen <15%: Kilduff) + **presumir** (share card 9:16 [AJUSTE: `.share-mock` existe pero scoped a `.dv-landing` — extraerlo a clase compartida en globals.css]). El historial de retos enlaza aquí.
→ nuevo `app/(app)/retos/_components/DuelResultDialog.tsx`, `retos/page.tsx`, `lib/actions/retos.ts`

**9. GameIcon — los emojis se retiran.** Sprite `<symbol>` 24×24, stroke 2px, esquinas geométricas (el lenguaje del mark), variante filled, color vía `currentColor`. 12 glifos: golpe, hielo, escudo, chispa (boost), **eslabones** (racha), munición (disco), rayo (energía), nivel (chevrón doble), duelo (dos discos enfrentados), premio (cofre), candado, corona. Los emojis 🥊❄️🛡️⚡🔒✦ [VERIFICADOS en AttackPanel/BoostButton] desaparecen de superficies de juego (quedan en copy conversacional y pushes). El mark como ornamento: separadores vía `mask-image` 16px opacity 0.3.
→ nuevo `app/_components/GameIcon.tsx`; sustituir en AttackPanel, DuelFeed, BoostButton, CharacterCard, recompensas, BottomHUD

**10. GameNumber + useCountUp.** Extraer el useCountUp de DuelScoreboard (rAF, ease-out cúbico, ya bien escrito) a `lib/hooks/useCountUp.ts` [AJUSTE: hoy anima desde 0 en mount; la versión extraída anima SOLO al cambiar — guardar el valor previo en ref]. `<GameNumber>`: odometer a mano (~60 líneas, columnas de dígitos `translateY` vía WAAPI, `aria-label` con valor real), tabular-nums, peso 800–900, glow por temperatura, `scale(clamp(1, 1 + val/1000, 1.3))`. Regla Balatro: todo número que representa progreso se mueve al cambiar; todo número estático es un dato muerto. Aplicar a: nivel, marcador, `+N pts`, racha, XP.
→ nuevos `lib/hooks/useCountUp.ts`, `app/_components/GameNumber.tsx`

**11. CharacterCard v2 — carta coleccionable.** [AJUSTE DE ARQUITECTURA: es server component — se queda server; la escarcha con countdown y la XP fantasma se montan como client islands hijos.] (1) Tiers: de `text-[9px] white/30` → 11px mono al 100% con anillos `--tier-ring-*` de §2 + número display (0–150) tabular junto al tier. (2) Barra de XP de dos capas EN LA HOME (StatBarLive). (3) Racha: chip eslabones ámbar [AJUSTE: la prop `racha` actual es la PERSONAL (`user_streak`) — se mantiene esa; etiquetarla "tu racha" para no confundir con la del trato del TratoHUD]. (4) Congelado: overlay `::after` de escarcha + anim-frost + countdown (client island). (5) Glare idle: capa `radial-gradient` con `mix-blend-mode: overlay` que respira 6s (cuenta como LA animación perpetua del viewport — el dv-breathe del TratoHUD y este glare no conviven en la misma pantalla: gana el TratoHUD, el glare solo en /perfil). (6) `.card-game` en vez del inline. ⚠️ `git status` antes de tocarlo (sesiones paralelas detectadas en el repo).
→ `app/_components/CharacterCard.tsx`, `ShowcaseCharacterCard.tsx`

**12. StreakChip — racha del trato permanente en top bar.** Visible en TODA pantalla: eslabones + número tabular en `--color-racha`. [AJUSTE: es la racha del TRATO (`trato_streak`); con multi-grupo usa el primer trato (mismo criterio MVP que home-authed).] Estados: sana / en-riesgo (`grayscale(0.8)` + pulso 2s + "vas 2/4") / recién subida (anim-pop + flash una vez). Tap → bottom-sheet con compliance de ambos (reusa la RPC `estado_trato`). Reduced-motion: gris estático + texto "en riesgo".
→ nuevo `app/_components/StreakChip.tsx`

**13. BoostButton v2 — ritual cooperativo teal.** [VERIFICADO: client; states gate/cooldown/ok ya vienen del server; dar_boost RPC con cooldown en DB.] Card 100% width, `bg: color-mix(in srgb, var(--mode-coop) 12%, transparent)`, border al 40%, icono chispa, texto sobre claro en `--color-coop-deep`. Al enviar: anim-pop + halo `box-shadow 0 0 0 0 → 0 0 0 8px color-mix(in srgb, var(--mode-coop) 35%, transparent)` fade 600ms. Trigger reposicionado al momento de máxima motivación: tras check-in propio exitoso → CTA "ya entrenaste — dale energía a ana" (home ya tiene los props server-side). Recibirlo: card capa M con el mark haciendo dv-breathe + CTA de reciprocidad. Estados bloqueados que enseñan: candado + "se desbloquea con racha de 2 sem (vas 1/2)"; cooldown: "disponible en N días" [AJUSTE: requiere exponer la fecha del último boost del emisor — añadirlo al cálculo server-side del state, 1 query]. **FIX P0 de copy falso**: `hintEscudo` dice "protege la racha esta semana" — FALSO [VERIFICADO: es.json:524 + en.json:524; el escudo bloquea ataques, migración f10] → "bloquea el próximo ataque rival" / "blocks the next rival attack".
→ `app/_components/BoostButton.tsx`, `messages/es.json`, `en.json`

**14. VeredictoDialog — el Veredicto del Domingo.** Al primer open tras el cierre (domingo 23:59 CDMX), takeover de una sola vez (persistir "visto" por semana en DB: migración `veredictos_vistos`, RLS owner): ambos cumplieron → ceremonia con count-up de la racha nueva y los dos discos pulsando desfasados; alguien falló → pantalla de deuda ("lo prometido es deuda, compa") con el castigo (P2). Milestones 2/4/8/12/24/52: animación EXCLUSIVA + share card 9:16 + Web Share API → WhatsApp. Mostrar `max_streak` [VERIFICADO: existe en `trato_streak` y `user_streak`, jamás se renderiza] ("tu récord: 14 sem").
→ nuevo dialog en `home-authed.tsx` o `app/(app)/veredicto/`, migración `veredictos_vistos`

**15. SelloDelPacto.** Crear el trato hoy termina en redirect seco — el pico de motivación desperdiciado. Pantalla de 1.6–2s: los dos discos entran desde lados opuestos (`translateX ±60px → 0`, 600ms spring), quedan respirando, "lo prometido es deuda" en mono tracking 0.18em fade 400ms, CTA "empezar". Y cuando el partner acepta el invite, el creador DEBE enterarse: push [VERIFICADO: `sendPushToComembers` existe; ya hay email de aceptación en lib/email/templates/accepted.ts — el push lo complementa] + banner "ana selló el trato".
→ `app/(app)/onboarding/*`, `app/invite/[token]/` [RUTA VERIFICADA], `home-authed.tsx`

**16. RewardClaimCard (P2).** Card "lista para reclamar" (borde pulsante 2s) que el usuario voltea — wobble 600ms → `rotateY(180deg)` 600ms `backface-visibility: hidden` → flash. Efecto dotación. Reduced-motion: crossfade.
→ `app/(app)/recompensas/page.tsx`, nuevo `RewardClaimCard.tsx`

**17. lib/juice.ts (P2).** buzz + AudioContext + toggle de sonido (§3).

---

## 5. Pantalla por pantalla (priorizado dentro de cada una)

**Home / lobby** — deja de ser un índice, es el lobby del trato:
1. Banner de impacto si hubo golpe/congelamiento <24h: entra con anim-shake UNA vez, `bg: color-mix(in srgb, var(--mode-rival) 12%, transparent)`, borde izquierdo 3px rival, texto en `--color-rival-deep` sobre claro, copy "te metieron un golpe — cóbratela" (a messages/*) → link a /retos. [AJUSTE: "sin ver" = dismiss en localStorage; query de ataques recibidos <24h del usuario.]
2. TratoHUD (§4.5).
3. Héroe "hoy te toca" + CheckinRow v2.
4. CharacterCard v2 con XP ghost + escarcha si congelado.
5. CTA contextual de boost post check-in.
6. Card de racha rota (UNA vez, flag visto en localStorage): récord preservado en grande ("su mejor marca: 11 sem — sigue ahí", de `trato_streak.max_streak`) + CTA "empezar la revancha". Prohibido el luto recurrente.
7. (P2) Misión de la semana cooperativa.

**Entrenamiento / hoy:** CheckinRow con hit-stop + recibo de esfuerzo; quickLog como `.btn-game`; chip de buff de energía con countdown desde `boosts.fecha_expira` [VERIFICADO: getBoostActivo ya la trae] ("tu próximo check-in vale +50% · expira en 18 h"); tooltip de una línea, una vez (`localStorage dovo_seen_{recurso}`) en la primera activación de cada recurso. Cero tutorial modal.

**Retos / arena:** AttackPanel consola de combate; DuelScoreboard v2; munición como slot-objeto; escudo propio visible ("traes escudo: el próximo golpe rebota"); DuelResultDialog al cierre; banner si el duelo venció sin cerrarse; (P1-tarde) scouting en RetoNuevoForm: cada candidato = mini carta 64px con clase + top_stat en su color + racha + head-to-head [VERIFICADO: `racha_duo`, `top_clase`, `top_stat` YA vienen en getLeaderboard y hoy se descartan]. Fix copy stale `pickRival` "id del dúo rival" [VERIFICADO: es.json:484].

**Leaderboard:** GameNumber al cambiar de tab; fila propia `position: sticky bottom-0` con backdrop-blur; (P2) deltas de posición "▲2"/"▼1" (teal EQU / rival) vs último cierre [AJUSTE: requiere snapshot del cierre anterior — NO existe; la migración `leaderboard_snapshots` (cron del domingo la llena) va incluida en el ítem P2]; (P2) reframe "Temporada N" con podio + trophy road vertical — la temporada resetea SOLO leaderboard, JAMÁS XP/niveles/tiers/prestige; activar prestige al cierre para top X.

**Recompensas:** racha gigante con count-up; `max_streak` visible; claim flip (P2); dot badge en el HUD cuando hay recompensa lista; milestone → share card WhatsApp.

**Perfil:** misma XPBar de dos capas (un solo componente StatBarLive — reemplaza la barra h-1 actual de perfil/page.tsx L97-102); mini-escala de 6 puntos bajo cada barra (Rookie→Legend, punto actual lleno); en `/grupo/[id]`: **Expediente del trato** estilo libro contable — fecha del pacto, racha actual, récord en foil sutil, semanas selladas, head-to-head W-L, boosts intercambiados. Cada fila es endowment: una razón para no romper.

---

## 6. Los 5 signature moves de dovo

1. **El hit-stop de 90ms.** Todo impacto congela la UI 90ms tras la respuesta y suelta todo el feedback junto. Nadie en producto web lo hace; cuesta un setTimeout. Quien pruebe dovo 30 segundos lo nota sin saber por qué.
2. **El mark que vive.** Los dos discos como personaje de estado: respiran desfasados cuando el dúo cumple (dv-breathe migrada del landing — transform-only, compatible), saltan con squash & stretch en el éxito (scaleY 1.15/scaleX 0.9 → settle `--ease-back`), se sacuden ±3px al recibir golpe, se escarchan congelados, entran desde lados opuestos al sellar el pacto. Duolingo sin Rive: un SVG + 4 clases CSS.
3. **La barra fantasma.** Provisional damage de fighting game en TODO medidor (XP + 6 stats): el fill salta con spring y la ghost bar drena 400ms después. Junto con el recibo de esfuerzo, cada check-in es una lectura visceral de progreso. Ninguna fitness app te muestra qué compró tu sudor; dovo te da el ticket.
4. **El Veredicto del Domingo.** Domingo 23:59 CDMX el trato se juzga: racha +1 (discos pulsando) o deuda (cinta de peligro + castigo del catálogo, saldable solo por el acreedor). Toda la semana cuenta regresivamente hacia ese momento desde el TratoHUD. Ninguna app de fitness tiene un clímax semanal a hora fija.
5. **Nada rival está a 90°.** Toda superficie de duelo/ataque/deuda lleva corte diagonal (clip-path 1–4%) y cinta de peligro a 45° en rojo; el resto de la app permanece ortogonal y calma. El ángulo ES el conflicto — y el revelado del escudo (90ms de silencio + 700ms de wobble) es la única slot machine de dovo, ética porque la moneda se gana entrenando.

---

## 7. Plan de ejecución

### P0 — HOY (orden estricto; el #1 bloquea todo lo demás)

1. **Payload de `crearCheckin`** (§4.0) → `lib/actions/checkins.ts`. [AJUSTE: capturar el return de `apply_checkin` que hoy se descarta + 3 lecturas ligeras; claves `flex`, no `fle`.] Sin datos no hay juice.
2. **Tokens + contrato de motion**: raw vars en `:root` + overrides dark + `@theme inline` (§2 — patrón del repo, NO hex en @theme), utilities `.card-game`/`.btn-game`/`.tape-rival`, matriz S/M/L reemplazando el comentario de L159, migrar las ~10 copias inline del panel oscuro [AJUSTE: TODAS menos `opengraph-image.tsx`, que requiere estilos inline] → `app/globals.css` + componentes listados en §2.
3. **Crear el scheduler de `cerrar_semana_rachas`** — [AJUSTE: la FUNCIÓN ya existe (`core.cerrar_semana_rachas(p_week date)`, migración 20260601120000, grant a service_role) — lo que falta es SOLO el scheduler, y la firma exige el lunes ISO. pg_cron corre en UTC: dom 23:59 CDMX = lun 05:59 UTC. Migración:
   `select cron.schedule('cerrar-semana-rachas', '59 5 * * 1', $$select core.cerrar_semana_rachas(date_trunc('week', (now() at time zone 'America/Mexico_City'))::date)$$);`
   Y un SEGUNDO job DIARIO (los duelos vencen cualquier día, no solo domingo): nueva función `core.cerrar_duelos_vencidos()` que llama `cerrar_reto` (ya existe, idempotente) para retos activos/aceptados con `periodo_fin < hoy` y marca `rechazado` las propuestas con >48h — `cron.schedule('cerrar-duelos', '5 6 * * *', …)` (00:05 CDMX). Fallback si pg_cron no está disponible en el proyecto: Vercel Cron → route handler con service_role (vercel.json existe, está vacío `{}`) — ojo: en plan Hobby es 1×/día con precisión laxa; pg_cron es la opción primaria.] Cualquier UI encima de un cron fantasma es escenografía.
4. **Fixes de 10 minutos**: hintEscudo falso → "bloquea el próximo ataque rival" (`messages/es.json:524`/`en.json:524`); copy stale `pickRival` (es.json:484); regenerar `lib/supabase/types.ts` (`castigo_text` stale en L50, del modelo dropeado — `npm run db:types`); `RETO_ACEPTAR_HORAS=48`: se implementa en `cerrar_duelos_vencidos` del punto 3 (cero promesas sin mecánica); [AJUSTE: + quitar Inter/JetBrains Mono del `<link>` de Google Fonts en `app/layout.tsx` L58 — es editar una URL, cabe aquí y no en P2].
5. **Los 3 componentes de máximo impacto**:
   - **CheckinRow v2** (hit-stop + recibo de esfuerzo + deltas) — el tap más importante de la app. Ya es client: cero fricción de arquitectura.
   - **StatBarLive de dos capas** (client island nueva) + XP en CharacterCard de home + flash de tier (⚠️ `git status` antes: sesiones paralelas en el repo).
   - **LevelUpDialog** (ceremonia L).

### P1 — esta semana (orden de impacto)

1. **BottomHUD** + **GameIcon** (la nav ES el HUD). [AJUSTE: montar en `app/(app)/layout.tsx` Y en `home-authed.tsx` — la home vive fuera del route group; active tab vía usePathname.]
2. **TratoHUD** en home + **migración `core.estado_trato`** [AJUSTE: imprescindible — la rutina del compa no es legible por RLS].
3. **El ataque recibido duele en la home**: banner de impacto + badge en HUD + escarcha en CharacterCard (visto = localStorage).
4. **AttackPanel v2**: consola de combate, revelado del escudo con tensión, countdown de congelamiento, estados pre-tap (copy "se recarga a medianoche").
5. **DuelScoreboard v2**: barra de ventaja, diferencial vivo, glows, head-to-head.
6. **DuelResultDialog** + revancha + cierre automático (cron del P0-3) + `canvas-confetti` (`package.json`, import dinámico) + extraer `.share-mock` del scope `.dv-landing`.
7. **`.btn-game` aplicado** a todas las acciones de juego + **tiers como material** (anillos, foil, cónico).
8. **BoostButton v2** teal + reposicionamiento post check-in.
9. **Veredicto del Domingo v1** (solo racha: sellada/rota; deuda completa en P2) + migración `veredictos_vistos`.
10. **SelloDelPacto** + push al creador cuando el partner acepta.
11. **GameNumber + useCountUp** extraídos y aplicados (nivel, marcador, racha — animar solo al cambiar, no en mount).

### P2 — backlog (orden recomendado)

1. **Resucitar la deuda**: tabla `deudas` + catálogo `castigos` (12–15 en voz MX: "pagas los tacos del sábado", "subes story haciendo burpees") + RLS; generación automática al fallar compliance (cron del Veredicto); cinta `tape-rival` en TratoHUD; solo el ACREEDOR marca cumplida; al saldar → ceremonia L + share card "deuda saldada". Regla de hierro: la misericordia (escudo/freeze) aplica a la RACHA, jamás a la deuda.
2. **StreakChip** permanente en top bar con estado de riesgo.
3. **Milestones de racha** con animación exclusiva + share card 9:16 → WhatsApp (Web Share API, fallback descarga).
4. **Scouting de rivales** en RetoNuevoForm (los datos ya vienen en getLeaderboard).
5. **Expediente del trato** en `/grupo/[id]`.
6. **lib/juice.ts** completo: audio sintetizado opt-in + toggle en /ajustes.
7. **Leaderboard**: deltas ▲▼ [AJUSTE: + migración `leaderboard_snapshots` que el cron dominical llena — sin snapshot no hay delta] + fila sticky + **Temporada N** + activar prestige.
8. **RewardClaimCard** flip + **racha rota** comeback card + **quest semanal cooperativa**.
9. **Limpieza de identidad**: Grain queda como está [AJUSTE: es overlay viewport-wide; los dialogs van al top layer y el HUD a z-70 — ver §2]; `landing.css` consume las vars de `@theme` (un origen de verdad); actualizar `BRAND.md` (raíz del repo) y `docs/specs/DESIGN.md` a "Mesa Nocturna" (hoy se contradicen entre sí y con el código).

---

## 8. Lo que el consejo PROHÍBE

**Dark patterns (líneas rojas del psicólogo — innegociables):**
1. Fabricar o simular el estado del otro ("tu rival está entrenando ahora" falso). La incertidumbre debe ser real.
2. Notificaciones o copy de culpa ("vas a decepcionar a ana"). El riesgo se muestra con desaturación + pulso, nunca con vergüenza.
3. Absolución comprable del castigo del trato. La misericordia (escudo, freeze) aplica SOLO a la racha, JAMÁS a la deuda — pagar para absolverse mata el producto.
4. Scarcity inflada o urgencia inventada. La munición expira a medianoche porque el sistema lo enforcea de verdad [VERIFICADO: munición = check-in de HOY CDMX]: comunicarla tal cual.
5. Daño-de-equipo estilo Habitica sin válvula de escape.
6. Pantalla de luto recurrente tras romper racha; contador en cero sin contexto del récord preservado (`max_streak` existe — usarlo).
7. Burla en la derrota. Derrota = desaturación + revancha, nunca shake ni mofa.

**Anti-patterns de juice (la fatiga mata el jackpot):**
8. Celebrar todo igual — el gating S/M/L es contrato: máx 1 capa L por visita; las L se encadenan, nunca se apilan.
9. Shake en eventos positivos (el shake es para impactos).
10. Partículas en capa S; confetti fuera de capa L.
11. Jitter/animación perpetua en más de 1 elemento por viewport.
12. Overshoot en color/opacity (solo transform); barras nuevas con `width` (solo `scaleX`); conic/foil en superficies >96px; [AJUSTE: más de dos backdrop-filter fijos simultáneos].
13. Tensión >800ms en el revelado del escudo — la tensión emociona, la espera frustra.

**Deuda de complejidad y coherencia:**
14. Dependencias nuevas más allá de `canvas-confetti` (única autorizada, lazy). Cero librerías de animación: CSS + WAAPI + rAF.
15. Emojis en superficies de juego (un juego tiene sprites); violeta fuera de "la casa"; diagonal/cinta fuera de superficies rivales; colores de modo en el chrome.
16. Celebraciones sin payload real detrás (ninguna animación se dispara de datos inventados) y promesas en UI sin mecánica en DB (regla RETO_ACEPTAR_HORAS — resuelta en P0-3).
17. Números sin procedencia: todo número boosteado que difiera del base se etiqueta inline ("solo personaje" — el split puntos/puntos_base ya existe en DB); errores P0001 crudos como estado esperado (los estados se derivan ANTES del tap; el P0001 queda solo como red de seguridad).
18. Tutorial modal (el onboarding es el candado: mecánica gateada se muestra bloqueada con requisito y progreso, nunca oculta).
19. Diseñar dependiendo de háptica (iOS no vibra) o de audio (default OFF, nunca único canal).
20. Resetear progresión en temporadas: solo leaderboard y liga; XP, niveles, tiers, clases y prestige son permanentes.
21. Romper reduced-motion: todo feedback informativo debe existir en versión estática. Es fallback funcional, no versión degradada.
22. [AJUSTE — nueva, del auditor:] **Texto de UI hardcodeado.** Todo copy nuevo (nudges, banners, estados, ceremonias) entra por `messages/es.json` + `en.json` vía next-intl — el soporte es/en es invariante del producto. Y todo color de modo usado COMO TEXTO sobre papel claro usa su variante `-deep` (AA ≥4.5:1); las variantes brillantes son para gráficos, glows y superficies oscuras.

— El director creativo, por el consejo de videojuegos de dovo. Revisión de factibilidad: auditor del consejo, verificada contra el repo el 2026-06-10.
