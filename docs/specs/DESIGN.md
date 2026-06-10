# Design System: dovo

**Product:** dovo (dovofit.com) — AI-reinforced training partnership for any two people (or a group). Fitness + nutrition, gamified as an RPG where your real body is the character.
**Status:** v1 working spec · 2026-05-19
**Reference prototypes:** `~/dovo/prototypes/solar.html` (chosen direction — light, Ultraviolet) · `~/dovo/prototypes/logo.html` (logo lab — metaball drops)

> ⚠️ **ADDENDUM GOBERNANTE (2026-06-10): "Mesa Nocturna".** El consejo de
> videojuegos tomó las riendas del diseño de la APP por mandato del founder.
> Donde este documento diga "editorial, sutil" para superficies de juego, manda
> [`2026-06-10-game-design-directive.md`](./2026-06-10-game-design-directive.md)
> (tokens de modos emocionales, contrato de motion S/M/L, hit-stop, HUD,
> ceremonias). El chrome (nav superior, forms, landing) sigue siendo editorial —
> esa separación ES la jerarquía. Veredictos completos del consejo en
> `2026-06-10-game-council-verdicts.md` + auditoría en
> `2026-06-10-game-council-audit.md`.

---

## 0. Theme Strategy (read first — it governs everything)

dovo runs **two surfaces with different theme rules**:

- **Landing (marketing site): light-first, committed.** Cool near-white base, oversized black type, electric-violet accent, premium photography, parallax. **Does NOT auto-switch by time.** A landing is a single brand statement — one confident impression for every visitor. Dark is used only as **accent sections** (e.g. "The System", "Built to share", final CTA) where the chromatic shader becomes the protagonist, creating a light→dark→light rhythm.
- **App (product): dual theme, follows the OS.** Honors `prefers-color-scheme` (which most users already schedule day/night) + a manual override in settings. **Do not build a custom clock that flips theme mid-session** — that feels broken. The "dark at night / light at day" instinct is correct, but inherited from the OS, not home-rolled.

The chromatic shader lives in: the landing's dark accent sections + the app's dark mode. In light contexts it softens into a warm-cool gradient wash.

---

## 1. Visual Theme & Atmosphere

**Vibe:** Aspirational, minimal, and *alive*. Editorial-grade restraint (think archar.framer.website / Linear / premium Framer portfolios) crossed with the energy of a game. Oversized typography commands each screen; generous whitespace lets it breathe; a single electric-violet accent and a living shader supply the motion. The product is not a clinical health tracker — it is a **game your body plays**, and the design should feel premium, energetic, and inclusive rather than hardcore or medical.

**Adjectives:** Airy · Confident · Electric · Editorial · Spatial · Inclusive.

**Anti-vibe (explicitly avoid):** warm cream/kraft + terracotta (reads as Claude/Anthropic), dark-grayscale-with-neon SaaS default (Linear/Vercel/Cursor clone = "Claude-generic"), Instagram-fitness gradients, hardcore-bro high-contrast silhouette photography, folkloric/Mexican motifs in public marketing.

---

## 2. Color Palette & Roles — "Ultraviolet"

The palette deliberately escapes both the Claude warm-clay family and the generic fitness-tech orange/blue. **Violet is unowned in fitness** and carries gaming/level-up connotation. One dominant accent; the spectrum is reserved for shaders, glow, and the stat system only — never as decorative flat fills.

### Light surface (landing default + app day)
| Descriptive name | Hex | Role |
|---|---|---|
| Cool Near-White | `#f4f4f6` | Primary background (replaces warm cream — no beige) |
| Lifted White | `#fafafb` | Card/panel backgrounds |
| Pure White | `#ffffff` | Highest surfaces, featured cards |
| Blue-Black Ink | `#08070d` | Oversized type, primary text |
| Ink @ 62% | `rgba(8,7,13,0.62)` | Secondary text |
| Ink @ 40% | `rgba(8,7,13,0.40)` | Captions, mono meta labels |
| Hairline | `rgba(8,7,13,0.12)` | Borders, dividers |
| Hairline Strong | `rgba(8,7,13,0.26)` | Active/hover borders |

### Dark surface (accent sections + app night)
| Descriptive name | Hex | Role |
|---|---|---|
| Absolute Black-Violet | `#07060d` | Deepest background (slight blue, not pure black) |
| Near-Black | `#08070d` | Dark section base |
| Mist | `rgba(255,255,255,0.06)` | Glass card backdrop |
| Glass | `rgba(255,255,255,0.10)` | Stronger glass |
| Pure White | `#ffffff` | Type + primary UI on dark |

### Brand accent (single dominant)
| Descriptive name | Hex | Role |
|---|---|---|
| **Electric Violet** | `#6d4aff` | THE signal — CTAs, active states, focus, dots, glow. Works on light and dark. |
| Deep Violet | `#5a37e0` | Hover/pressed |
| Violet Glow | `rgba(109,74,255,0.40)` | Box-shadow halation, CTA glow |
| Soft Violet | `#a78bff` | Lighter pairing (logo two-tone, gradients) |

### Spectrum (shaders + gamification ONLY — never flat decorative fill)
| Name | Hex |
|---|---|
| Violet | `#6d4aff` |
| Electric Blue | `#3a86ff` |
| Cyan | `#3ac4d6` |
| Acid Lime | `#aef03c` |
| Magenta | `#c44aff` |

---

## 3. The 6-Stat Color System (product-specific)

The RPG character has six attributes; each owns a spectrum color so the character sheet, share cards, and level-ups are colour-coded and learnable.

| Stat | Meaning | Color | Hex |
|---|---|---|---|
| **FUE** Fuerza / Strength | lifting capacity | Violet | `#6d4aff` |
| **RES** Resistencia / Endurance | sustained cardio | Electric Blue | `#3a86ff` |
| **FLEX** Flexibilidad | range of motion | Magenta | `#c44aff` |
| **VEL** Velocidad | explosive capacity | Cyan | `#3ac4d6` |
| **EQU** Equilibrio | body control | Teal | `#3ac49a` |
| **VIT** Vitalidad | nutrition + recovery | Acid Lime | `#aef03c` |

---

## 4. Typography Rules

| Role | Family | Weight | Character |
|---|---|---|---|
| **Display / oversized headlines** | Geist | 800 | Tight tracking (`-0.05em` to `-0.06em`), line-height `0.82–0.9`. Sizes are deliberately enormous (`clamp(72px, 13–19vw, 320px)`). The big type *is* the layout. |
| **Wordmark** | Syne | 800 | lowercase `dovo`, tracking `-0.03em`. Never recolored to accent; ink on light, white on dark. |
| **Body / UI** | Geist | 400–600 | Comfortable reading, `-0.005em`. |
| **Mono / data, stats, meta, eyebrows, clock** | Geist Mono | 400–500 | Uppercase, letter-spacing `0.1–0.16em`. Carries the "instrument/telemetry" feel. |

Headline reveal: lines rise from a clipped baseline (`translateY(105%) → 0`, cubic-bezier `0.16,1,0.3,1`), staggered ~180ms.

---

## 5. Logo System — the two O's as drops

The two O's of **dovo** are abstracted into the brand mark: **two liquid drops that approach until they fuse into a single form, then separate — but never fully detach.** A metaball/gooey bridge always connects them. This is the literal thesis of the product: two people, one bond that stretches but does not break.

- **Technique:** SVG goo filter — `feGaussianBlur` (stdDeviation ~10) + `feColorMatrix` alpha threshold (`0 0 0 22 -11`). Vector, scales infinitely, ~0 weight. See `logo.html`.
- **Bond constraint:** drop separation is capped at ~`1.78 × radius` — the exact point before the liquid neck would snap. **That maximum distance is a brand parameter:** how taut the relationship gets without breaking.
- **Mono vs two-tone:** Mono Electric Violet for small sizes (favicon, app icon — legibility). Two-tone (Violet + Acid Lime) for hero/marketing — each drop is a distinct member; the neck blends them. "Two become one without ceasing to be two."
- **Lockup:** animated mark + `dovo` wordmark, mark to the left.
- **Wordmark variant:** the two o's can render as breathing liquid drops within the text (subtle, in-sync).
- **Exports needed:** `app/icon.svg`, `favicon.svg`, static + animated lockups.

---

## 6. Component Stylings

- **Primary button (light):** Pill, ink fill `#08070d`, white text; on hover lifts `-2px` and fills **Electric Violet**. Arrow glyph slides right on hover.
- **Primary button (dark / "liquid"):** Pill, glassmorphic — `linear-gradient(135deg, rgba(255,255,255,0.14), 0.04)` + `backdrop-filter: blur(14px)` + 1px translucent border + inset highlights + violet glow shadow. Lifts on hover.
- **Ghost button:** Mono uppercase text + arrow, no chrome; dim → full ink on hover.
- **Nav:** Fixed, thin. Live mono clock on the left ("TRAINING TIME — hh:mm:ss"), center mono links, pill CTA right. On light it sits transparent; dark sections invert.
- **Cards (stories):** Generously rounded (`20px`), no border, full-bleed gradient cover (spectrum-tinted) with a small mono label, name + one-line quote + week-count below. Lift `-6px` on hover.
- **Cards (system grid):** Hairline grid of equal cells, `12px` outer radius, mono index number in violet, title + short body. Background lifts to white/glass on hover.
- **Character card (3D render zone):** Dark cool card (`#0b0a14 → #16132a`), wordmark + tier, 3-up stat block (color-coded), composite class name ("The Athlete") with the noun in violet. Floats with perspective tilt parallax.
- **Share card (9:16):** Dark, radial violet+magenta glow, huge stat value with violet glow, label, three mono footer pairs (class / streak / top stat). Designed to be screenshot-shared with no context.
- **Pricing tiers:** Rounded `16px`, hairline; featured tier gets violet border + white bg + violet glow + filled violet CTA. List bullets are small violet dots.

**Depth & elevation:** Mostly flat with hairline separation on light. Elevation is expressed through **glass blur + violet glow halation**, not heavy drop shadows. Dark sections add soft long shadows for the floating cards.

---

## 7. Motion & Shaders

- **Hero shader (light):** WebGL warm-cool gradient flow — cool near-white → lavender → electric violet, drifting on value noise. Lives inside the hero only (not fixed full-page on light).
- **Chromatic shader (dark sections / app dark):** RawShaderMaterial chromatic wave-bands (`0.05/abs(p.y + sin(...))` with R/G/B dispersion), washed toward the violet spectrum, **driven by scroll** (vertical bias + slight zoom = camera dolly). Renders at 0.6× pixel ratio, `blur(0.4px)` for cheap bloom. Poster-image fallback under `prefers-reduced-motion` / low-power.
- **Parallax (archar-style, differential):** Layers translate at different rates vs viewport center (`translate3d`, lerped). Portrait moves slow (depth), section titles float, the 3D render card tilts + rises on scroll so it crosses the type. Scroll value is lerped (`+= (target-last)*0.08`) for buttery, spatial inertia — never scroll-jacking.
- **Scroll reveal:** Sections fade-up (`translateY(40px) → 0`, 900ms) via IntersectionObserver. Stats count up on entry.
- **Grain:** Fixed full-screen SVG `feTurbulence` overlay, ~4–6% opacity, `mix-blend-mode: multiply` (light) / `overlay` (dark). The premium-print "tell."

---

## 8. Layout Principles

- **Big type is the layout.** Headlines are the primary structural element, not decoration. One architectural anchor per section.
- **Generous, uneven whitespace.** Sections breathe; rhythm varies (compact ↔ spread), never uniform hairline spacing.
- **Spatial UI / depth.** 3 z-layers minimum (shader → content → grain). Glass + parallax create perceived depth instead of flat stacking.
- **Max content width** ~1600px, gutter `40–48px` (→ `22–24px` mobile).
- **Numbered structure** for process/system (01–06) with oversized index numerals that light up violet on hover.
- **Marquee** for the use-loop verbs (Pair up · Pick your sport · Train · Track · Level up · Share).

---

## 9. Landing Structure (section order)

1. **Nav** — wordmark/mark + live clock + links + pill CTA
2. **Hero** — eyebrow + live tag, oversized headline ("Stronger / in pairs.*"), warm-cool shader, portrait zone (right), dual CTA
3. **Marquee** — use-loop verbs
4. **Statement** — single oversized editorial line ("Discipline, shared•")
5. **Render showcase** — 3D character-card zone with parallax tilt
6. **How it works** — numbered 01–04 (Pair up → Set sports → Train & track → Level up)
7. **The System** — 6 cells, the stat/level/streak/AI-plans/body-analysis/rewards mechanics
8. **Stories** — social-proof grid, diverse duos (body positive, multi-sport)
9. **Pricing** — Free (first 200 duos) / Pro / Premium
10. **Built to share** *(dark accent section)* — share-card showcase + platforms
11. **Final CTA** *(can be dark)* — oversized closer + dual CTA
12. **Footer** — wordmark + product/trust/reach columns

---

## 10. Imagery Direction

- **Body positive, multi-sport, inclusive casting** — diverse bodies, genders, ages, abilities, sports (gym, running, pilates, ballet, swimming, climbing, boxing, yoga). Document-style natural light (Apple Fitness+ / Nike doc tier), **not** plastic stock or ripped-silhouette fetishization.
- **Photography ≠ body-analysis photos.** Marketing portraits are consented, public, voluntary (release form). The in-app body-analysis photo is private, processed, deleted in 60s — never marketing.
- Prototype currently uses gradient placeholder "photo zones" with labels; real photography (curated stock first, own shoot post-200-users) replaces them.

---

## 11. Voice & Language

- **Landing / public marketing: neutral international English/Spanish.** No Mexican colloquialisms.
- **Stat-class names are brand vocabulary, not translated** ("The Athlete", "El Tronco") — they function like proper nouns (cf. Strava "Local Legend").
- **In-app microcopy:** MX-coloquial regional variant is still under consideration (pending decision); landing stays neutral.
- Tone: confident, aspirational, plain. Lead with the duo/bond and the game, not with health jargon.

---

## 12. Open decisions / next steps

- [ ] Confirm logo drops feel (size, speed, separation distance, mono vs two-tone) — review `logo.html`
- [ ] Confirm Ultraviolet accent vs alternatives — review `solar.html`
- [ ] Decide whether in-app voice goes neutral or keeps MX-coloquial regional
- [ ] Replace photo placeholders with real (curated stock → own shoot)
- [ ] Port chosen direction (`solar.html`) into production `~/dovo/app` (Next 15 + Tailwind v4), wire the metaball mark as `app/icon.svg`
- [ ] Build dark-mode token set for the app (mirror of light tokens) following `prefers-color-scheme`

---

## Cross-references
- Memory: `feedback-dovofit-brand-direction`, `project-dovofit-palette`, `feedback-dovofit-principles`, `project-dovofit-vision`, `feedback-dovo-lenguaje`
- Prototypes: `~/dovo/prototypes/solar.html`, `~/dovo/prototypes/logo.html`
