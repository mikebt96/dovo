# Plan de ejecución — limpieza dovo post F13-F22

Ejecutar en orden estricto (G0→G23). Un commit por grupo. Cada grupo tiene gate de verificación; si el gate falla, NO avanzar. Ruta del repo: `~/dovo`. Todos los hallazgos ya fueron verificados adversarialmente: no re-investigar, ejecutar tal cual.

---

## FASE 0 — Preparación (G0)

1. `git status` ANTES de todo — hay sesiones paralelas conocidas en este repo (gotcha documentado). Si hay cambios ajenos, no tocarlos; trabajar en rama nueva `cleanup/f13-f22`.
2. Baseline (guardar salida para comparar): `npx tsc --noEmit`, `npm run build`, `npm run lint`, `npm test`, `node scripts/_check_i18n.mjs`.
3. Convención de verificación por grupo: **tsc** = `npx tsc --noEmit` limpio; **build** = `npm run build` limpio; **browser** = `npm run dev` y revisar a ancho de teléfono (~390px, regla del repo: mobile-web-first); **grep gate** = el grep indicado devuelve lo esperado.

---

## FASE 1 — Borrado de muerto y docs (cero riesgo runtime)

### G1 — Código muerto TS/CSS [media-baja/muerto]
**Archivos:** `app/_components/StatBar.tsx`, `app/globals.css`, `app/_components/CheckinRow.tsx`, `lib/email/templates/*`, `lib/pulse.ts`, `lib/utils/pulse-buckets.ts`, `tests/unit/pulse-buckets.test.ts`.
**Cambios:**
- Borrar `app/_components/StatBar.tsx` (cero imports; las barras vivas son StatBarLive).
- En `app/globals.css`: borrar keyframes `anim-bar-w`/`anim-bar-h` (L312-313) y clases `.anim-bar-w`/`.anim-bar-h` (L406-407) — StatBar era su único consumidor. Borrar `.anim-press` (L404-405) y `@keyframes anim-tier-flash` (L335-339, incluye `--flash-color`) + `.anim-tier-flash` (L434) — cero consumidores; el tier-up ya lo cubre LevelUpDialog (decisión deliberada, CheckinRow.tsx:81).
- Actualizar comentarios huérfanos: `CheckinRow.tsx:58-59` («patrón BAR_CLASS de StatBar» → citar DuoChampion.tsx) y `globals.css:41-42` («Used by StatBar…» → «StatBarLive / DuoLeaderRow»).
- Borrar `lib/email/templates/_shared.ts`, `invite.ts`, `accepted.ts`, `closed.ts` (cero llamadores; closed.ts además usa el modelo dropeado). **Conservar** `lib/email.ts` y la dep `resend` con un comentario TODO apuntando a directiva §4.15 (ver «NO arreglar aún» #3).
- Borrar `lib/pulse.ts`, `lib/utils/pulse-buckets.ts` y `tests/unit/pulse-buckets.test.ts` (emisor muerto, payload incompatible con el modelo actual; cero dependientes). NO tocar la edge function, PulseOptOutToggle, ni la infra DB pulse (ver «NO arreglar aún» #4).
**Verificación:** grep gate `StatBar|anim-bar|anim-press|tier-flash|flash-color|inviteEmail|acceptedEmail|closedEmail|dispatchPulseEvent|categorizeGoal` en app/, lib/, tests/ → solo debe quedar lib/email.ts si aplica. tsc + build + `npm test` (suite verde sin pulse-buckets.test).

### G2 — i18n muerto y duplicado [media-baja/muerto]
**Archivos:** `messages/es.json`, `messages/en.json`, `app/(app)/nutricion/_components/FoodLogQuickAdd.tsx`.
**Cambios:**
- Borrar EN PAR (es+en, mismas líneas) las 14 claves huérfanas: en `home` → navProfile(202), navTrain(204), navLeaderboard(205), navRetos(206), navRewards(208), heroEyebrow(209), heroRest(210), heroRestBody(211), heroCta(213), heroVerSemana(214), level(217), streak(218), todayTitle(219); en `showcase` → navDemo(607). NO tocar: home.navSettings, home.navNutrition, home.heroNext, home.boostActive*, home.mission*, home.atkBanner*, home.proUpsell*, ni showcase.heroEyebrow(609)/showcase.streak(617) (homónimos vivos).
- FoodLogQuickAdd.tsx:39 y :63: `t(\`tipos.${…}\`)` → `t(\`tipo.${…}\`)`. Borrar el bloque `nutricion.tipos` (es.json:741-746 y en.json:741-746). Copy canónico de snack = «colación» (respaldado por spec en ComidaInteractiva.tsx:10-12).
**Verificación:** `node scripts/_check_i18n.mjs` limpio; JSON parsea (`node -e "require('./messages/es.json'); require('./messages/en.json')"`); browser: /nutricion registro rápido muestra «colación».

### G3 — BRAND.md [media/muerto, doc-only]
**Archivos:** `BRAND.md`.
**Cambios:** (a) addendum gobernante al inicio (patrón de docs/specs/DESIGN.md:7-15) apuntando a `docs/specs/2026-06-10-game-design-directive.md`; (b) tabla de colores (L119-141) → tokens reales de globals.css:64-88 (paper #f4f4f6, ink #08070d, signal #6d4aff, stats, modos) o enlace a globals.css; (c) tipografía → Geist/Geist Mono/Syne con vars --font-display/--font-body/--font-mark/--font-mono; (d) BORRAR sección Component API (L147-172, describe archivos inexistentes); (e) Asset registry (L174-183) → inventario real (scripts/gen-icons.mjs, /apple-touch-icon.png, /manifest.webmanifest); (f) pricing L263: $99 → $139 MXN/dúo/mes; (g) quitar filas lib/brand.ts y app/components/brand.tsx de la tabla L280-285; (h) actualizar fecha L296. NO tocar voz/lenguaje, naming, lockup rules. Cierra P2-9 de la directiva.
**Verificación:** doc-only, sin gates de código.

---

## FASE 2 — Consolidaciones mecánicas (sin cambio de comportamiento, salvo 1 bugfix destapado)

### G4 — Result<T> compartido (SOLO PASO 1) [alta/dup]
**Archivos:** nuevo `lib/actions/result.ts` + 20 archivos de `lib/actions/`.
**Cambios:** Crear `lib/actions/result.ts` **SIN** `"use server"`: `export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };` (helpers ok/err opcionales). En los 19 archivos con la línea idéntica (profile:8, nutrition:21, ataques:7, trato:7, apuestas:8, rutina:8, boosts:6, retos:8, rewards:6, perfil:10, workout:27, grupos:13, push:6, admin:9, molestias:8, bodyscan:10, lugares:5, billing:10, checkins:13) + leaderboard:18: borrar la declaración local, añadir `import type { Result } from "@/lib/actions/result";`. **NO tocar auth.ts** (ver «NO arreglar aún» #1).
**Verificación:** grep gate `type Result<` en lib/actions/ → solo result.ts y auth.ts (ActionResult). tsc + build.

### G5 — Mapas de stats consolidados + bugfix topStat [alta/dup + bug vivo]
**Archivos:** `lib/leveling/display.ts`, `lib/scoring/types.ts`, `lib/scoring/stats.ts`, `app/_components/CheckinRow.tsx`, `LevelUpDialog.tsx`, `CharacterCard.tsx`, `DuoChampion.tsx`, `DuoLeaderRow.tsx`, `ShowcaseCharacterCard.tsx`, `app/(app)/retos/nuevo/RetoNuevoForm.tsx`. (StatBar ya no existe — G1.)
**Cambios:**
1. En `lib/scoring/types.ts` (dominio): añadir `STAT_FROM_LABEL: Record<string, StatKey>` ({FUE:'fue', RES:'res', FLEX:'flex', VEL:'vel', EQU:'equ', VIT:'vit'}). `lib/scoring/stats.ts` borra su LABEL_TO_KEY local (L5-7) e importa de `./types`.
2. En `lib/leveling/display.ts` (presentación, canónico): añadir `STAT_VAR` (StatKey→`var(--stat-*)`), `STAT_BG_CLASS` (→`bg-stat-*`), `STAT_TEXT_CLASS` (→`text-stat-*`), todos `Record<StatKey, string>`, con el comentario anti-purga («Las clases bg-stat-* se referencian de forma estática… para que Tailwind no las purgue»). Re-exportar `STAT_FROM_LABEL` desde aquí para los componentes. Reusar el `STAT_SHORT` ya existente (L10-17).
3. Borrar copias locales: CheckinRow:61-76, LevelUpDialog:20-35, RetoNuevoForm:21-28, DuoChampion:5-21, DuoLeaderRow:5-22, ShowcaseCharacterCard:5-20; derivar el array STATS de CharacterCard:7-14 de STAT_KEYS+STAT_SHORT+STAT_VAR.
4. **Bugfix obligatorio** (lo destapa el tipado estricto): RetoNuevoForm.tsx:69 — c.topStat llega en MAYÚSCULAS del RPC. Cambiar a: `const key = c.topStat ? STAT_FROM_LABEL[c.topStat] : undefined; const statColor = key ? STAT_VAR[key] : null;`.
**Verificación:** tsc + build. grep gate: `STAT_LABEL|STAT_DOT|LABEL_TO_KEY` → cero en componentes. Browser: /retos/nuevo — el top stat de cada rival AHORA se pinta de color (antes siempre null); home y leaderboard sin cambios visuales.

### G6 — DAY_KEY único [baja/dup]
**Archivos:** `lib/workout/fecha.ts`, `app/_components/home-authed.tsx:43-51`, `app/(app)/nutricion/page.tsx:24-32`, `app/(app)/grupo/[id]/rutina/page.tsx:32-40`.
**Cambios:** Exportar `DAY_KEY: Record<string,string>` desde fecha.ts (7 entradas, «miércoles»→«miercoles», «sábado»→«sabado»); importar en los 3 archivos y borrar copias. **NO unificar los fallbacks** de los call sites (`?? "lunes"` vs `?? d.dia` vs `?? proxima.dia` — se quedan como están).
**Verificación:** tsc + build; grep gate `"miércoles": "miercoles"` → solo fecha.ts (+ json de mensajes).

### G7 — lib/juice.ts (háptica + reduced-motion) [baja/dup]
**Archivos:** nuevo `lib/juice.ts` + 13 call sites.
**Cambios:** Crear `lib/juice.ts` con: `vibrateTap()` (12), `vibrateJackpot()` ([40,40,90]), `vibrateHit(blocked: boolean)` (blocked?30:15 — preservar magnitudes actuales, NO introducir el 60ms de spec), `prefersReducedMotion()` con guard `typeof window !== "undefined"`. Reemplazar: vibrate en LevelUpDialog:68, VeredictoDialog:33, DuelResultDialog:64, SelloDelPacto:29 (jackpot); CheckinRow:131, TratoHUDClient:107, ApuestaSheet:46, ApuestaSaldarButton:24, ComidaInteractiva:52 (tap); AttackPanel:64 (hit). matchMedia en AttackPanel:45, landing.tsx:55, lib/hooks/useCountUp.ts:13. Los condicionales de negocio (p.ej. `if (sellada)`) quedan en el call site.
**Verificación:** tsc + build; grep gate `navigator.vibrate` → solo lib/juice.ts; `prefers-reduced-motion` en .ts/.tsx → solo lib/juice.ts (CSS no se toca aquí).

### G8 — AppNav: prop muerta [baja/muerto]
**Archivos:** `app/_components/AppNav.tsx` + 14 archivos (22 renders).
**Cambios:** Eliminar el union NavKey (L5-13); prop → `active?: "ajustes"`. Quitar la prop en los 17 usos con valores muertos (home-authed:186; leaderboard:38; perfil:81; perfil/scan:28,37; recompensas:26,48; nutricion:48,66,82,96; grupo/[id]/rutina:95,114,153; retos:41,86; retos/nuevo:46); conservar solo ajustes/page.tsx:42. Los 4 sin prop no se tocan.
**Verificación:** tsc + build; browser: link «ajustes» visible en home y oculto en /ajustes.

---

## FASE 3 — Tokens y diseño (CSS/markup; cambio visual controlado, cero lógica)

### G9 — --surface-game + migración a .card-game [alta/dup, P0 de la directiva]
**Archivos:** `app/globals.css`, `app/(app)/admin/page.tsx:36-43`, `app/(app)/perfil/scan/_components/ScanFlow.tsx:57-63`, `app/_components/DuoChampion.tsx:36-42`, `app/_components/ProBadge.tsx:16-22`, `app/_components/ShowcaseCharacterCard.tsx:28-33`, `app/showcase/page.tsx:19-24`.
**Cambios:**
1. globals.css: en `:root` añadir `--night-1: #16132a; --night-2: #0b0a14; --night-3: #07060d;` y en @theme el token que la directiva §2:69 especificó y nunca se creó: `--surface-game: radial-gradient(130% 150% at 12% 0%, var(--night-1) 0%, var(--night-2) 55%, var(--night-3) 100%);`. Cambiar globals.css:211 a `background: var(--surface-game);`.
2. admin:36-43, ScanFlow:57-63, DuoChampion:36-42: borrar style inline completo **Y** quitar `rounded-3xl` (obligatorio — colisiona con el radius de la utility); dejar `className="card-game relative overflow-hidden p-7 …"`. Cambio visual intencional: radius 24→20px.
3. ProBadge:18-22: NO aplicar card-game; solo `background: "var(--surface-game)"`, conservando su boxShadow chico y rounded-full (directiva §2:73: pills siguen rounded-full).
4. showcase/page.tsx:19-24: NO card-game (hero full-bleed); mantener su variante de gradiente pero con `var(--night-1/2/3)`.
5. ShowcaseCharacterCard:28-33: opción (b) — mantener su gradiente variante (posición distinta, sin sombra: «diseñada para screenshot») referenciando `var(--night-*)`, conservar rounded-[20px]. Documentar con comentario. NO tocar `app/opengraph-image.tsx:23` (excepción documentada — Satori exige inline).
**Verificación:** grep gate `#16132a` en app/ → solo globals.css (vars) y opengraph-image.tsx. Build. Browser: /admin, /perfil/scan, leaderboard (DuoChampion), badge PRO, /showcase — paneles idénticos salvo radius 20px.

### G10 — Tokens de color estáticos para paneles oscuros [media/dup + media/diseno]
**Archivos:** `app/globals.css`, nuevo `lib/ui/game-colors.ts`, VeredictoDialog, DuelResultDialog, ApuestaSemanal, ApuestaSheet, CharacterCard, recompensas/page, MisionesHoy, nutricion/page, ScanFlow, scan/page, admin/page.
**Cambios:**
1. globals.css `:root` (junto a los mode-tokens, con comentario «panel de juego siempre oscuro ⇒ valor fijo, no reactivo; ver bug de racha en recompensas/page.tsx:65»): `--game-racha: #ffb454; --game-coop: #4adfb2; --game-muted: #9aa0ae;` (+ mapeo @theme inline para usarlos como clases si conviene).
2. `lib/ui/game-colors.ts`: `export const GAME_COLORS = { gold: "#f0c75a", racha: "#ffb454", coop: "#4adfb2", muted: "#9aa0ae" } as const;` con comentario cruzado a globals.css — única fuente JS (canvas-confetti no resuelve var()).
3. `#f0c75a` → `var(--mode-gold)` en: VeredictoDialog:52,73,129; DuelResultDialog:116,131,142-143; ApuestaSemanal:72 (el token es idéntico en los 3 temas → cero delta; funciona dentro de color-mix). **Excepción:** DuelResultDialog:72 (confetti) → `GAME_COLORS.gold` con comentario.
4. `#ffb454` → `var(--game-racha)` (CharacterCard:60, ApuestaSemanal:64 ×2, recompensas:67-68, ApuestaSheet:85, VeredictoDialog:86-87); `#4adfb2` → `var(--game-coop)` (MisionesHoy:78-79,130,156; nutricion:142-143); `#9aa0ae` → `var(--game-muted)` (VeredictoDialog:52, DuelResultDialog:116).
5. Stats sobre paneles siempre-oscuros: ScanFlow:69-70 → `var(--stat-flex)`/`var(--stat-vit)` y cambiar el textShadow del helper Big (ScanFlow:218) de concat `${color}55` a `color-mix(in srgb, ${color} 33%, transparent)`; admin:47 → `boxShadow: "0 0 16px color-mix(in srgb, var(--stat-vit) 53%, transparent)"`.
6. Superficies reactivas (corrección funcional, no panel oscuro): scan/page.tsx:62 → `className="text-stat-flex"`; ScanFlow:206 → `accent-signal` en vez de `accent-[#6d4aff]`.
7. **Resolución de conflicto entre hallazgos:** nutricion/page.tsx:121-123 (los 3 `<Macro color=…>`) NO va a --stat-*: aplica el hallazgo del léxico (violeta=la casa, prohibido en recursos). Crear tokens `--macro-p: #ff8a5c; --macro-c: #f5a623; --macro-g: #8ecae6;` en :root (+ comentario «léxico §2: macros nutricionales, hues no reclamados») y usar `var(--macro-*)` en las 3 props.
**Verificación:** grep gate en app/: `#f0c75a` → solo globals.css y game-colors.ts (y el confetti vía import); `#ffb454|#4adfb2|#9aa0ae` → solo globals.css/game-colors.ts; `#6d4aff` no aparece en nutricion/page.tsx. Build. Browser dark+light: ceremonias Veredicto/DuelResult, /recompensas, /nutricion, /perfil/scan — sin cambios perceptibles salvo macros P/C/G con colores nuevos.

### G11 — Contraste AA [alta-media/diseno]
**Archivos:** `app/globals.css`, `app/(app)/retos/_components/DuelFeed.tsx`, `AttackPanel.tsx`, `app/_components/MisionesHoy.tsx`, `DuelScoreboard.tsx`, `ApuestaSemanal.tsx`, `ApuestaSheet.tsx`, `DuelResultDialog.tsx`, `DuoChampion.tsx`, `DuoLeaderRow.tsx`, `ShowcaseCharacterCard.tsx`.
**Cambios:**
1. globals.css: en `:root` light `--freeze-deep: #0c6d7c; --ammo-deep: #4a7000;`; en LOS DOS bloques dark (media query L91-114 y [data-theme="dark"] L117-138) override `--freeze-deep: var(--stat-vel); --ammo-deep: var(--stat-vit);`. Mapear en @theme inline (`--color-freeze-deep`, `--color-ammo-deep`). Aplicar: DuelFeed:60 `text-stat-vel`→`text-freeze-deep` (border/bg tintados se quedan); AttackPanel:111 `text-freeze`→`text-freeze-deep`; AttackPanel:158 `color: var(--stat-vit)`→`var(--ammo-deep)`; AttackPanel:204 `hover:text-freeze`→`hover:text-freeze-deep` (+ `hover:border-freeze`→`hover:border-freeze-deep`). NO tocar el botón congelar de :182 (fondo cyan + tinta, ya AA).
2. globals.css @theme: `--color-signal-on-game: #8f70ff;` (5.1-5.7:1 en todo el rango del gradiente — NO usar #8262ff, falla en la esquina clara). Aplicar en los 9 usos: MisionesHoy:102,117; ApuestaSheet:55; DuelResultDialog:175; DuoChampion:55; DuelScoreboard:88 → clase `text-signal-on-game`; DuelScoreboard:115 y ApuestaSemanal:86 → `var(--color-signal-on-game)` en style (en DuelScoreboard:115 cambiar también el color-mix del bg del chip al mismo token); ShowcaseCharacterCard:62 → STAT_TEXT solo para `fue` apunta a variante on-game. CharacterCard:80 NO se toca (texto grande, pasa). Documentar junto a @utility card-game: «sobre .card-game usar tokens *-on-game/--game-*, nunca el token reactivo».
3. ApuestaSheet:65 (botón sellar, #b8860b): quitar `text-white`, usar `--btn-color: var(--mode-gold)` + color de texto fijo `#08070d` (≈11.8:1; mismo patrón que AttackPanel:183 «blanco sobre cyan falla AA; tinta sí»). El shadow 3D de .btn-game se deriva solo de --btn-color: seguro.
4. Racha ámbar (arbitraje #1): DuoLeaderRow:64-65 — sacar la racha del div `opacity-70` (aplicar opacity-70 solo a top_stat/top_clase) y renderizar `<span className="flex items-center gap-1" style={{ color: "var(--mode-racha)" }}><GameIcon name="eslabones" size={11}/>{t("streak",{n:row.racha_duo})}</span>`; DuoChampion:72 y ShowcaseCharacterCard:60 — mismo span con `color: "var(--game-racha)"` (panel siempre-oscuro). GameIcon es server-safe.
**Verificación:** Build. grep gate: `text-stat-vel` ya no en DuelFeed:60; cero `freeze-deep|ammo-deep` huérfanos. Browser light theme en /retos: chip «congelado» y munición legibles; leaderboard: racha ámbar con eslabones a opacidad plena; botón «sellar apuesta» texto oscuro sobre oro.

### G12 — CardHalo [media/dup]
**Archivos:** nuevo `app/_components/CardHalo.tsx` + CharacterCard:50-54, DuoChampion:44-51, recompensas/page:53-60, nutricion/page:103-107, LevelUpDialog:88-94, VeredictoDialog:46-55, DuelResultDialog:110-119, SelloDelPacto:42-49.
**Cambios:** Componente presentacional sin hooks (usable en server y client): props `position?: "corner"|"center"` (corner=`-top-24 -right-16 w-64 h-64`, center=`-top-20 left-1/2 -translate-x-1/2 w-72 h-72`; tamaño atado a position), `color?: string` (default `"var(--c-signal)"`), `opacity?: number` (default 0.4). Render: `<div aria-hidden className={"pointer-events-none absolute rounded-full blur-3xl " + posClasses} style={{ opacity, background: \`radial-gradient(circle, color-mix(in srgb, ${color} 55%, transparent), transparent 70%)\` }}/>`. Migrar las 8 copias: 4 corner (CharacterCard, DuoChampion, recompensas, nutricion) usan defaults — delta aceptado: violeta pasa a var(--c-signal) (consistente con SelloDelPacto:47) y alpha 0.5→55% (imperceptible bajo blur-3xl); ceremonias pasan color/opacity actuales (LevelUp accent dinámico op. 0.5; Veredicto/DuelResult `var(--mode-gold)`/`var(--game-muted)` op. 0.45-0.5/0.15; SelloDelPacto default op. 0.4).
**Verificación:** grep gate `blur-3xl` en app/_components y app/(app) → solo CardHalo.tsx. Build + browser: halos presentes en card de personaje, champion, recompensas, nutrición y 4 ceremonias.

### G13 — @utility chip-game [baja/dup]
**Archivos:** `app/globals.css`, `app/_components/CheckinRow.tsx`, `LevelUpDialog.tsx`, `MisionesHoy.tsx`.
**Cambios:** Crear junto a btn-game: `@utility chip-game { border-radius: var(--radius-chip); padding: 0.25rem 0.625rem; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-flex; align-items: center; gap: 0.25rem; background: color-mix(in srgb, var(--chip-color, transparent) 14%, transparent); }` (fallback transparent → chips outline sin bg). Migrar SOLO las 8 instancias núcleo: CheckinRow:225,242,256,273,282,302 (**mantener la clase `chip-delta` además** — es animación de entrada, no estilo; color dinámico vía `style={{ "--chip-color": STAT_VAR[k] }}`), LevelUpDialog:151 y MisionesHoy:76 (normalizan tracking 0.14→0.12 — delta mínimo aceptado; **NO añadirles chip-delta**, son estáticos). **NO migrar:** DuelResultDialog:139 (badge display — a lo sumo `rounded-[10px]`→token), ApuestaSemanal:63 / nutricion:140 (píldoras rounded-full deliberadas, ver «NO arreglar aún» #7).
**Verificación:** Build. Browser ~390px: chips del recibo de check-in idénticos (con animación intacta), chips de LevelUp/Misiones sin saltos de layout. grep gate: `var(--radius-chip)` ahora tiene consumidor.

### G14 — Emojis → GameIcon [alta-media/diseno, prohibición §8.15]
**Archivos:** `app/_components/GameIcon.tsx`, `app/(app)/retos/_components/DuelFeed.tsx`, `ScanFlow.tsx`, `app/(app)/perfil/page.tsx`, `app/(app)/perfil/scan/page.tsx`, `app/(app)/suscripcion/page.tsx`, `app/(app)/nutricion/page.tsx`, `AiRegenButton.tsx`, `AiWorkoutButton.tsx`, `grupo/[id]/rutina/page.tsx`, `app/(app)/recompensas/page.tsx`.
**Cambios:**
1. DuelFeed (núcleo, mandatado por nombre en §4.9): L78 `const icono: GameIconName = a.resultado === "bloqueado" ? "escudo" : a.tipo === "golpe" ? "golpe" : "hielo";`; L85-87 → `<GameIcon name={icono} size={18} filled={icono !== "hielo"} className="shrink-0 mt-0.5"/>`; L62 chip congelado → `<GameIcon name="hielo" size={13}/>` antes del nombre (patrón AttackPanel:206; hereda text-stat-vel vía currentColor). Import como AttackPanel:7.
2. Añadir 2 glifos a GameIconName/PATHS siguiendo el estilo SVG existente: `camara` y `plato`. Usar: camara en ScanFlow:172, perfil/page:107, suscripcion:102; plato en suscripcion:96. ProPreviewCard (suscripcion:117): cambiar prop `icon: string` → `icon: GameIconName` y renderizar `<GameIcon name={icon} size={28}/>`.
3. ✦ → `<GameIcon name="chispa" size={11} className="inline -mt-px"/>` en las 11 instancias (ScanFlow:66,99; perfil/scan/page:73; nutricion:135; AiRegenButton:17,38; AiWorkoutButton:36,47,79,137; rutina/page:170). Las 3 dentro de template literals (ScanFlow:66, nutricion:135, rutina:170) requieren reestructurar a fragmento JSX `<><GameIcon …/> {t("…")}</>`; envolver icono+texto en `inline-flex items-center` donde no lo esté.
4. /recompensas (page:90,117,166): NO migrar DB. Lookup `Record<string, GameIconName>` de los 10 emojis sembrados → glifos existentes cuando haya match semántico en GameIcon.tsx (revisar el catálogo real; fallback `"premio"` para todo lo demás). La fila :117 conserva grayscale/opacity-50 gratis (currentColor).
**Verificación:** grep gate: `🥊|❄️|🛡️|📸|🥗|✦` en app/ → cero (los seeds SQL no se tocan). tsc + build. Browser: /retos feed del duelo, /perfil, /suscripcion, /nutricion, /recompensas — sprites en lugar de emojis.

### G15 — reduced-motion + shake indebido [media-baja/diseno]
**Archivos:** `app/globals.css`, `app/_components/DuelScoreboard.tsx`, `ScanFlow.tsx`, `app/(app)/loading.tsx`, `app/showcase/page.tsx`, `app/_components/CheckinRow.tsx`, `messages/es.json`+`en.json`, `AttackPanel.tsx`.
**Cambios:**
1. DuelScoreboard:154,163: quitar `transition` del style inline (dejar background/transform/transformOrigin); añadir clase `bar-advantage` a ambos divs; en globals.css, DENTRO del bloque `@media (prefers-reduced-motion: no-preference)` existente (junto a .bar-fill L440-441): `.bar-advantage { transition: transform 700ms var(--ease-snap); }`.
2. `animate-pulse` → `motion-safe:animate-pulse` en ScanFlow:182, loading.tsx:5, showcase/page.tsx:42.
3. CheckinRow: el «+N pts» desaparece con reduced-motion (§8.21). Añadir un chip persistente al recibo: span con clase `chip-delta chip-game` (base opacity:1 = visible siempre) con `t("ptsChip", { pts: reward.puntos })` — clave nueva en es.json+en.json en el namespace que CheckinRow ya usa (es: «+{pts} pts»; en: «+{pts} pts»). Renderearlo como primer chip del bloque de deltas (L220-294) y ampliar la condición del bloque a `(deltasVisibles.length > 0 || (reward && reward.puntos > 0))`. Sin «✓» ni emoji. Dejar el span flotante anim-float-away intacto (capa decorativa). AttackPanel:98 NO se toca.
4. AttackPanel:91: quitar `anim-shake` del banner de golpe conectado (§3: shake jamás en eventos positivos); opcional añadir `anim-pop` como el banner de freeze L108. **NO** cablear el CustomEvent al DuelScoreboard (ver «NO arreglar aún» #5).
**Verificación:** Build + `node scripts/_check_i18n.mjs`. Browser con `prefers-reduced-motion: reduce` emulado (DevTools): check-in muestra chip «+N pts» estático; barra de ventaja salta sin animar; pulses quietos. Sin reduce: todo anima igual + chip nuevo.

### G16 — Barrido red-* → rival [baja/diseno]
**Archivos:** ~22 archivos de app/ (~30 ocurrencias).
**Cambios:** Sustitución 1:1 de clases de error: paneles oscuros (`text-red-300`) → `text-rival`: ApuestaSheet:138, DuelScoreboard:209, DuelResultDialog:200. Superficies claras (`text-red-500/600/700`) → `text-rival-deep`: BoostButton:111, ScanFlow:110,186, PushSettings:186, LogExerciseButton:100,117,214, AiWorkoutButton:82,140, FoodLogQuickAdd:83, AiRegenButton:41, NutritionProfileForm:161, UpgradeButton:71, GrupoForm:105,153, PerfilForm:163, RutinaForm:128, JoinButton:37, GoogleButton:34, DemoLoginButton:41, PulseOptOutToggle:52, WishlistColumn:105, sign-in:60, sign-up:69, admin/page:106, AdminTools:87. Dots de status `bg-red-500` → `bg-rival`: admin/page:46,90, AdminTools:58.
**Verificación:** grep gate `red-[0-9]{3}` en app/ → **cero**. Build.

---

## FASE 4 — Lógica y datos (lo que puede romper algo; al final)

### G17 — Familia de fechas CDMX (TS) [alta/bugs — 6 hallazgos, un solo tema]
**Archivos:** `lib/workout/fecha.ts`, `lib/nutrition/macros.ts`, `lib/actions/nutrition.ts`, `lib/actions/retos.ts`, `lib/actions/admin.ts`, `lib/actions/ataques.ts`, `lib/utils/periodo.ts`, `lib/actions/leaderboard.ts`, `app/_components/CheckinRow.tsx`, `TratoHUDClient.tsx`, `MisionesHoy.tsx`, `DuelScoreboard.tsx`.
**Cambios (en este orden):**
1. `fecha.ts`: añadir `export function fechaCDMX(d: Date = new Date()): string` (el Intl.DateTimeFormat existente); redefinir `hoyCDMX = () => fechaCDMX()`. Exportar `dowCDMX()` (extraído de TratoHUDClient:25-28). El módulo es puro Intl, seguro en "use client".
2. Duplicados de hoyCDMX: CheckinRow:53-56 (borrar HOY local, importar hoyCDMX — actualizar también su comentario), ataques.ts:37-38 → hoyCDMX(), ataques.ts:114-116 → `fechaCDMX(new Date(a.created_at))`, nutrition.ts:178 → hoyCDMX(), TratoHUDClient:20-28 → importar hoyCDMX + dowCDMX.
3. **weekStartISO (bug alta):** borrar `weekStartISO` de macros.ts:52-58; en nutrition.ts reemplazar los 5 usos (L142,263,296,423,445) por `lunesSemanaCDMX()` de `@/lib/workout/fecha` (ningún caller pasa argumento; formato idéntico).
4. **periodo.ts (bug):** reescribir `periodoRange("semana")` sobre `{ start: lunesSemanaCDMX(0), end: lunesSemanaCDMX(1) }`, eliminar isoWeekStart; «mes» anclado a CDMX: `const ym = hoyCDMX().slice(0,7); start = ym+"-01"` y end = primer día del mes siguiente calculado con aritmética UTC sobre ese string. Corregir el comentario engañoso L1-2. leaderboard.ts:27 no cambia de firma. (Único consumidor verificado: leaderboard.ts.)
5. **retos.ts (bug alta):** borrar hoyISO (L38-40); helper `ventanaReto()` = `{ inicio: hoyCDMX(), fin: inicio+RETO_DURACION_DIAS días }` con base `new Date(inicio+"T00:00:00Z")` + setUTCDate (patrón lunesSemanaCDMX); usarlo en crearReto (L56-59) y responderReto (L114-117). admin.ts:87: hace7d con la misma base CDMX.
6. **logFood (bug alta):** nutrition.ts:474 → insertar `{ user_id: user.id, tipo, descripcion, fecha: hoyCDMX() }` (import ya añadido en paso 2).
7. **MisionesHoy:** L52-59 reemplazar `.order("week_start",{ascending:false}).limit(1)` por `.eq("week_start", lunesSemanaCDMX())` (la ausencia de fila ya cae en «configura tu plan»).
8. **DuelScoreboard:48:** `new Date(m.periodo_fin + "T00:00:00-06:00").getTime()` (CDMX = UTC-6 fijo, convención del repo).
**Verificación:** tsc + build + `npm test`. grep gate: `toISOString().slice(0, 10)` en lib/actions/ → cero (salvo derivados de strings CDMX en helpers); `weekStartISO|isoWeekStart|hoyISO` → cero. Browser: home (check-in cuenta hoy), /nutricion (plan de ESTA semana), /retos (countdown del duelo coherente). Prueba manual del caso límite si es posible: cambiar reloj del sistema a domingo 19:00 CDMX en dev y verificar que leaderboard/apuesta/plan apuntan a la MISMA semana.

### G18 — Estado de cliente y efectos [media-baja/bugs]
**Archivos:** `app/_components/home-authed.tsx`, `BannerAtaque.tsx`, `TratoHUDClient.tsx`, `ApuestaSemanal.tsx`, `VeredictoDialog.tsx`, `SelloDelPacto.tsx`, `CheckinRow.tsx`, `AttackPanel.tsx`, `ComidaInteractiva.tsx`, `lib/actions/nutrition.ts`, `app/(app)/nutricion/page.tsx`.
**Cambios:**
1. home-authed:204: `<BannerAtaque key={ataque.id} …/>` (remount por ataque; quitar el eslint-disable de BannerAtaque si queda innecesario).
2. TratoHUDClient:70-74: re-sincronizar con el key vigente: `useEffect(() => { setNudgeState(prev => prev === "confirm" ? prev : localStorage.getItem(nudgeKey) ? "sent" : "idle"); }, [nudgeKey]);`.
3. ApuestaSemanal (rama 'viva', L107-120): `<ApuestaSheet key={\`${data.actual.id}|${data.actual.premio_text}|${data.actual.apuesta_text}\`} …/>`. La rama sin apuesta no necesita key. NO usar useEffect([inicial]).
4. Guard de backdrop: VeredictoDialog:42 y SelloDelPacto:39 → `onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}` (patrón ApuestaSheet:74-76). NO tocar los CTAs internos (VeredictoDialog:155,163; SelloDelPacto:89).
5. Timers: en CheckinRow y AttackPanel añadir `useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = []; }, []);` (import useEffect). ComidaInteractiva: crear `const timer = useRef<…|null>(null)`, asignar en dislike() y cleanup en useEffect.
6. vetarComida: nutrition.ts:323-325 eliminar el reintento con `[]` (dejar solo la llamada con `enElDia`; `?? null` ya cubre el vacío, contrato documentado en L311). nutricion/page.tsx:296: key → `\`${ci}-${c.tipo}-${c.nombre}\`` (índice+nombre: única entre hermanos Y conserva el remount al cambiar platillo — NO usar solo índice, ComidaInteractiva siembra useState(esFavorito) del prop).
**Verificación:** tsc + build. Browser: (a) descartar banner de ataque, simular ataque nuevo (o revisar que el remount por key dispara anim-shake); (b) tap DENTRO del card del Veredicto NO lo cierra, tap en backdrop sí; (c) editar apuesta sigue funcionando tras sellar; (d) vetar comida 4-5 veces seguidas en un día con snacks → sin warning de keys duplicadas en consola.

### G19 — Migraciones SQL [alta/bugs]
**Archivos:** nuevos en `supabase/migrations/` (timestamp 20260613XXXXXX).
**Cambios (3 migraciones, en archivos separados):**
1. `fix_cerrar_apuestas_null.sql`: `create or replace function core.cerrar_apuestas(date)` — declarar `v_procesado boolean;` y reemplazar L68-73 de la versión vigente por: `select (ts.last_evaluated_week >= p_week), coalesce(ts.last_cumplido_week = p_week, false) into v_procesado, v_cumplio from core.trato_streak ts where ts.trato_id = a.trato_id; if v_procesado is distinct from true then continue; end if;`. Resto idéntico. Re-aplicar al final `revoke execute … from public, anon, authenticated; grant execute … to service_role;`. Misma firma → el cron no se toca.
2. `food_logs_default_cdmx.sql`: `alter table core.food_logs alter column fecha set default ((now() at time zone 'America/Mexico_City')::date);` (cinturón del fix de G17.6).
3. `cerrar_reto_guard_periodo.sql` (defensa en profundidad del fix G17.8/DuelScoreboard): en cerrar_reto v2, añadir tras las validaciones existentes: `if v_reto.estado in ('aceptado','activo') and ((now() at time zone 'America/Mexico_City'))::date < v_reto.periodo_fin and auth.role() <> 'service_role' then raise exception 'el duelo aún no termina'; end if;` (replicar la función completa de 20260610030000_f10_ataques.sql:96-119 con el guard insertado; re-aplicar grants).
**Verificación:** Si hay Docker: `supabase db reset` + smoke de los crons. Si no (gotcha conocido de esta WSL): validar sintaxis por lectura y aplicar vía MCP de Supabase (`apply_migration`) en el proyecto; luego `list_migrations` confirma. Caso de prueba lógico de (1): dúo con fila trato_streak {last_cumplido_week: null, last_evaluated_week: p_week} → apuesta pasa a 'perdida'; sin fila → espera.

### G20 — Observabilidad de errores Supabase [media/bugs]
**Archivos:** `home-authed.tsx`, `retos/page.tsx`, `grupo/[id]/page.tsx`, `MisionesHoy.tsx`, `lib/actions/checkins.ts`, `trato.ts`, `retos.ts`, `nutrition.ts`, `apuestas.ts`.
**Cambios — dos sub-pasos, commits separados:**
- **Sub-A (solo log, aditivo, cero riesgo):** capturar `error` y `console.error("[origen] …", error.message)` (patrón workout.ts:48-102) en: home-authed:62,69,76; MisionesHoy:32-70 (4 queries); trato.ts:121-131,135-143,146-157; retos.ts:203-213; nutrition.ts:60-67; apuestas.ts — solo `miembros`/`streak` del Promise.all (L51), `existente` (L158-164) y `me` (L185-190); checkins.ts:71-81,84-89,108-113,119-128,229-234,238-243.
- **Sub-B (cambio de comportamiento, con cuidado):** (1) home-authed: si falla la query de trato_miembros, `throw error` (error boundary) — NUNCA renderizar «crea tu grupo» por un fallo transitorio; (2) retos/page:30-36 y grupo/[id]/page:45-62: `if (error) throw error;` antes de los empty-state/notFound (el «sin filas» legítimo sigue igual); (3) checkins.ts:135-140: si falla la lectura de `previos`, `return { ok: false, error: "..." }` (mismo trato que el RPC en L198) — NO continuar con acumulado=0 (rompe CAP_PUNTOS_DIA y falsea municionLista); (4) nutrition.ts:288-293 y 368-374: distinguir error («error de red, intenta de nuevo» genérico) de «sin perfil» («completa tu perfil primero»). MisionesHoy se queda en solo-log (omitir chips ante error es opcional, no hacerlo ahora).
**Verificación:** tsc + build + `npm test`. Browser flujo feliz completo: home con dúo, /retos, /grupo/[id], check-in con puntos — comportamiento idéntico. Revisión de diff: Sub-A no cambia ningún return; Sub-B solo cambia ramas de ERROR (imposibles en flujo feliz).

### G21 — unirseAGrupo: cap por tipo [media/bugs, parcial]
**Archivos:** `lib/actions/grupos.ts`.
**Cambios:** En el lookup (L92) incluir tipo_grupo: `select("id, estado, tipo_grupo")`. Antes del insert: `const { count } = await supabase.schema("core").from("trato_miembros").select("id", { count: "exact", head: true }).eq("trato_id", grupo.id);` y rechazar según cap por tipo: pareja=2, pequeno=6, grande=sin cap — **NO cap plano de 2** (rompería los tipos que GrupoForm ofrece en onboarding). Error con código estable (`"grupo_lleno"` si G22 ya pasó, o texto es por ahora). El trigger DB + rotación de invite_token + decisión §4.5 vs GrupoForm quedan diferidos (ver «NO arreglar aún» #2).
**Verificación:** tsc + build. Lógico: join a pareja con 2 miembros → rechazado; a pequeno con 3 → permitido.

### G22 — i18n de errores de actions (alcance mínimo) [media/bugs]
**Archivos:** nuevo `lib/i18n/action-errors.ts` (o similar), `lib/actions/apuestas.ts`, `retos.ts`, `ataques.ts`, `app/_components/ApuestaSheet.tsx`, `AttackPanel.tsx`, `DuelScoreboard.tsx`, `ApuestaSemanal.tsx`, `home-authed.tsx`, `VeredictoDialog.tsx`, `messages/es.json`+`en.json`.
**Cambios:**
1. Convertir a códigos estables SOLO los literales enumerables que llegan a los 3 renders crudos: apuestas.ts:147,166,217-221 (p.ej. `apuesta_cerrada`, `saldar_no_deudor`…), retos.ts (los que retorna cerrarReto hacia DuelScoreboard), ataques.ts:155,173 (validaciones propias, NO los P0001 del RPC — pass-through deliberado, ataques.ts:169).
2. Helper con set de códigos conocidos: `export const KNOWN_ERROR_CODES = new Set([...])`. En ApuestaSheet:138, AttackPanel:214, DuelScoreboard:209: `const msg = KNOWN_ERROR_CODES.has(err) ? t(\`err.${err}\`) : err;` — **NO** `t()` directo con clave desconocida (next-intl lanza MISSING_MESSAGE); los no-enumerables (error.message de Supabase, P0001) se muestran tal cual = status quo, sin regresión para usuarios es.
3. Claves nuevas `err.*` en es.json Y en.json (namespace propio o sección nueva — la sección "errors" existente de en.json:872 es de not-found/boundary, no mezclarse).
4. Fallbacks: ApuestaSemanal:45 (`?? "tu compa"`) y home-authed:191 (`?? "tu dúo"`) → claves i18n (ambos ya tienen `t` en scope); VeredictoDialog:111 literal `sem` → clave tipo `recordUnit`.
5. Pushes (retos.ts:93, grupos.ts:125, apuestas.ts:193, ataques.ts:178-189, trato.ts:84) y `lib/trato/apuestas-catalogo.ts`: NO traducir; añadir comentario «es-only deliberado, BRAND.md §español MX-first; por-locale requiere persistir idioma del receptor (schema)».
**Verificación:** `node scripts/_check_i18n.mjs`; tsc + build. Browser en locale **en** (LanguageToggle): forzar un error enumerable (sellar apuesta cerrada / retarse a sí mismo) → mensaje en inglés; el resto de la UI ya estaba en inglés.

---

## FASE 5 — Tipos de Supabase (al final: puede destapar errores de compilación)

### G23 — Regenerar lib/supabase/types.ts [alta/muerto, P0-4 de la directiva]
**Archivos:** `lib/supabase/types.ts` (+ los archivos que tsc señale).
**Cambios:** `npm run db:types` con `supabase start` activo (config.toml ya expone public+core+pulse). **Sin Docker en esta WSL** (gotcha conocido): usar el MCP de Supabase `generate_typescript_types` contra el proyecto remoto y pegar el output completo (reemplaza el archivo entero; no hay que «borrar» tablas a mano). Después, **obligatorio**: `npx tsc --noEmit` — los tipos reales pueden aflorar errores en queries que hoy compilan por el tipado degradado; corregirlos de forma mínima (preferir quitar casts `as unknown as` que el tipo generado haga innecesarios, p.ej. home-authed:98-102; no cambiar lógica). Riesgo acotado: solo 4 archivos importan `Database` (client/server/middleware/service).
**Verificación:** tsc limpio, `npm run build` limpio, `npm test` verde. grep gate: `castigo_text` ya no como L50 stale del modelo viejo (puede reaparecer legítimamente si la columna existe en DB — lo que importa es que el archivo sea generado, no el stub).

---

## Verificación final (gate de cierre, antes del PR)

1. `npx tsc --noEmit` + `npm run build` + `npm run lint` + `npm test` + `node scripts/_check_i18n.mjs` — todo limpio.
2. Greps de cierre: `red-[0-9]{3}` en app/ = 0; `#16132a` solo globals+og; `navigator.vibrate` solo juice.ts; `weekStartISO|hoyISO|isoWeekStart` = 0; `🥊|❄️|🛡️|📸|✦` en app/ = 0; `type Result<` solo result.ts+auth.ts.
3. Browser ~390px, ambos temas y con reduced-motion emulado: home (check-in completo con ceremonia), /retos (duelo+ataques+feed), /nutricion (plan+veto+registro), /recompensas, /leaderboard, /perfil/scan, ceremonias Veredicto/Sello/LevelUp/DuelResult, /admin.
4. Login demo para pruebas: demo+ivan@dovofit.com / dovodemo2026 (memoria del proyecto).

---

## NO ARREGLAR AÚN (riesgo > beneficio) — dejar comentario/issue, no tocar

1. **Result PASO 2 (auth.ts)** — retipar signUp/signIn/signInWithGoogle cambia la forma runtime y toca GoogleButton.tsx:20; beneficio puramente cosmético sobre el flujo más crítico (login). Diferir.
2. **Trigger DB de cardinalidad + rotación de invite_token en grupos** — la RLS `miembros_insert_self` permite insert directo sin token (hueco real), pero el fix correcto depende de una decisión de producto pendiente: directiva §4.5 («SIEMPRE son dos») contradice GrupoForm (vende grupos 3-6/7+). **Escalar al founder**; el cap en la action (G21) mitiga la vía normal mientras tanto.
3. **Borrar lib/email.ts + dep resend** — la directiva §4.15 asume un email de aceptación que nunca se cableó; si el founder lo quiere, lib/email.ts es la pieza a conservar. Solo se borran los templates muertos (G1). Corregir la premisa falsa de §4.15 en la directiva al decidir.
4. **Retirar edge function ingest-pulse-event + PulseOptOutToggle + claves ajustes.pulse* + infra DB pulse (role pulse_writer, core.users.pulse_opt_out, tests de integración)** — decisión de roadmap (¿Pulse vive?). Si se reactiva, el payload entero debe rediseñarse contra el modelo actual; mientras, solo se borró el emisor muerto (G1).
5. **Shake del DuelScoreboard vía CustomEvent al conectar golpe** (§4.6) — wiring cross-component nuevo para un efecto decorativo; en G15 solo se quita el anim-shake mal puesto (la violación). El cableo correcto es feature de juice, no limpieza.
6. **Pushes y catálogo de apuestas por-locale** — requiere persistir la preferencia de idioma del RECEPTOR (trabajo de schema, no de strings). Documentado es-only en G22.
7. **Unificar las píldoras ApuestaSemanal:63 / nutricion:140 al chip-game** — son rounded-full deliberadas; cambiarlas contradice la jerarquía pill/chip de la directiva §2. Decisión de diseño aparte.
8. **UPDATE retroactivo de retos activos con ventana corrida** (creados antes de G17.5) — solo relevante si hay duelos vivos al desplegar; operación manual de datos, evaluar en deploy.
9. **Mover fecha.ts a lib/utils/** — cosmético, ~14 imports de churn sin beneficio funcional.
10. **ShowcaseCharacterCard a .card-game completo** — cambiaría visualmente el share-card (gradiente centro-arriba + sin sombra son deliberados para screenshot); se quedó en vars --night-* (G9). Decisión con founder si se quiere unificar.
11. **CharacterCard.tsx:80 a signal-on-game** — pasa AA como texto grande; migrar es solo consistencia, opcional.
12. **Cablear anim-tier-flash (capa M, §4.2)** — el tier-up ya escala a ceremonia L por decisión deliberada (CheckinRow.tsx:81); revivir la capa M es decisión de producto. Se borró el CSS muerto (G1).
13. **MisionesHoy: omitir chips ante error de query** — Sub-B opcional; con el log (G20-A) ya hay observabilidad y cambiar el render ante errores raros añade estados nuevos sin diseño.
