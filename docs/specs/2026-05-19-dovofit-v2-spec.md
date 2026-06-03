# dovofit · Spec v2

**Fecha**: 2026-05-19
**Estado**: Canónico (reemplaza `2026-05-16-mvp-tratos-pulse-design.md`)
**Producto**: dovofit — plataforma de actividad física + nutrición con AI, gamificada, para dúos y grupos
**Dominio**: dovofit.com · **Wordmark**: `dovo` (lowercase, se mantiene del BRAND.md)

> Este spec consolida 41 decisiones de producto tomadas el 2026-05-19 durante el pivot de "dovo commitment device genérico" a "dovofit". Las memorias `project_dovofit_vision.md`, `feedback_dovofit_principles.md` y `feedback_dovofit_brand_direction.md` son la fuente original; este doc es la versión canónica para implementación.

---

## 1 · Qué es dovofit

Una persona o grupo se compromete a una **rutina de actividad física** medible (gym/pilates/ballet/running) + opcionalmente **plan nutricional personalizado por AI**. El sistema mide cumplimiento por **puntos calculados** (calorías quemadas normalizadas por BMR + compliance nutricional), promedia por miembro, y aplica **gamificación profunda** (el user es un personaje RPG con 6 atributos que progresan). Continuo sin fecha fin; los ciclos son **semanales** (cumplimiento de rutina) y **mensuales** (progresión de nivel).

**La afirmación canónica**: no es una fitness app con gamificación encima — es un RPG donde tu cuerpo real es el protagonista.

**Dirección competitiva (añadido 2026-06-03): "Hyrox para cualquier disciplina."** Coop dentro del dúo + competencia estandarizada entre dúos ("entre ambos se retan y se motivan"). Hyrox estandariza el *formato* para hacer comparables a dos personas; dovo no fija el formato (cada quien su deporte) sino el **esfuerzo normalizado por BMR** — ese es su estándar comparable. Ver §3.16 y `docs/ROADMAP_COMPETITIVO.md`.

### Diferenciadores

1. **El user es el personaje**: 6 stats físicos (FUE/RES/FLEX/VEL/EQU/VIT) que suben con entrenamiento real
2. **Equivalencia entre objetivos distintos**: A hace gym, B hace ballet, ambos cumplen su trato sin uniformidad forzada
3. **Recompensas reales** (marketplace), no badges cosméticos — desde el tier Free
4. **AI personalizada**: meal plans + análisis corporal + (post-MVP) lectura de estudios médicos
5. **Compromiso continuo**: sin fecha fin, decay suave si abandonas, rutinas alternativas para viaje
6. **Coop + competencia ("Hyrox para cualquier disciplina")**: cooperas con tu dúo (racha compartida, boosts), compites contra otros dúos (leaderboard, retos) — comparables vía puntos normalizados por BMR, sin importar la disciplina

---

## 2 · Principios canon (no negociables)

Ver `feedback_dovofit_principles.md` para detalle. Resumen:

1. **Sin texto libre** — actividades del catálogo cerrado, no input de texto
2. **Trato continuo** — sin `duracion_dias`, evaluación por ciclos
3. **Equivalencia** — objetivos distintos comparables vía puntos
4. **Puntos como denominador común** — calorías + esfuerzo + nutrición → puntos
5. **Gamificación real** — subir nivel cambia el target, no solo el badge
6. **Foto corporal privada y desechable** — análisis interno, deleted (excepto tracking opt-in)
7. **Soft disclaimer** — no es advice médico
8. **Privacy by architecture** — core (PII) vs pulse (anonimizado)

---

## 3 · Subsistemas

### 3.1 Identity & Onboarding
- **Google OAuth** como método primario (reemplaza magic link)
- **Onboarding minimal, 3 pantallas**:
  1. Google OAuth signup
  2. Encuesta perfil físico: peso, altura, edad, género, nivel actividad base (sedentario→muy activo), objetivo (perder grasa / ganar músculo / mantener / mejorar resistencia). **+ opción "más datos para mayor personalización"** → experiencia previa + lesiones/limitaciones
  3. Crear o unirse a grupo
- **Empty state primer login**: hero motivacional + CTA single action

### 3.2 Grupos
- **Sin límite de miembros**. UX destaca 3 tiers con botones de fácil acceso: pareja (2) / pequeño (3-6) / grande (7+)
- **Invite multi-format**: email + link + QR + WhatsApp share + invite tray (contactos con dovofit) + username search (@handle)
- **Roles democráticos**: todos pueden invitar; cambios de config por consenso. (Nota: monitorear caos en grupos grandes; admin role si feedback lo pide)

### 3.3 Actividad física
- **Catálogo base 4 actividades**: gym, pilates, ballet, running. Cada una con metadata: kcal/unidad, métricas estructuradas requeridas
- **Métricas por actividad**:
  - Gym: peso (kg), reps, sets
  - Running: distancia (km), tiempo (min)
  - Ballet/Pilates: tiempo (min), intensidad (1-5)
- **Rutina por miembro**: cada uno arma su rutina semanal (actividad × frecuencia × duración). Ejemplo: Miguel gym 7×/60min; novia gym 3× + ballet 3×
- **Check-in**: user elige nivel de detalle. Smart default (1-2 taps) con expand opcional para métricas. Posible toggle global rápido/detallado en settings
- **Rutinas alternativas**: además de la rutina default, el user puede crear variantes (viaje, recovery) con menor target. Mantiene racha activa. NO hay "pausa".

### 3.4 Equivalencia + Scoring
- **Normalización por BMR** (Mifflin-St Jeor: edad + peso + altura + género). Targets ajustados al metabolismo individual, no absolutos
- **Pipeline**: métricas → calorías quemadas → puntos. Compliance nutricional → puntos. Promedio → calificación individual. Promedio del grupo → score grupal
- Función central `calcularPuntos(actividad, métricas, perfil)` como source of truth

### 3.5 Character System (gamificación)
- **6 atributos** (display tier-based, valor interno log sin cap):
  - FUE (Fuerza) ← gym pesas
  - RES (Resistencia) ← running, gym cardio
  - FLEX (Flexibilidad) ← ballet, pilates
  - VEL (Velocidad) ← running, gym (secondary)
  - EQU (Equilibrio) ← ballet, pilates
  - VIT (Vitalidad) ← nutrición compliance (MVP); + sleep/recovery (post-MVP)
- **Tiers de display**: Novato (0-25) / Aprendiz (25-50) / Atleta (50-75) / Experto (75-100) / Maestro (100-150) / Leyenda (150+)
- **Clases compuestas** (multi-class): AI asigna name único en MX-flavor según combo de stats top. Pure FUE → "El Tronco", Pure RES → "El Maratón", FLEX+EQU → "La Pluma", balanced → "El Atleta", all-rounder → "El Pentatleta", all-maxed → "El Crack"
- **Niveles infinitos + prestige**: unlock prestige requiere **doble gate** (nivel 50 AND racha 26 semanas). Reset nivel a 1, mantiene stats, badge "Prestige N", class name evoluciona ("El Crack · Inmortal")
- **Decay suave 10%/mes** si no cumples target del mes
- **Visual**: stat sheet minimalista, sin avatar (alineado BRAND.md editorial)

### 3.6 Ciclos
- **Semanal**: cumplimiento de rutina. Cierre combinado:
  - Automático: email con resumen + XP awarded + score individual/grupal
  - + Social opcional: el grupo define recompensa/castigo (texto libre, ejecutado off-platform)
- **Mensual**: progresión de nivel basada en esfuerzo del mes
- Continuo, sin fecha fin

### 3.7 Marketplace de recompensas (CORE — tier Free)
- **3 fuentes**: wishlist personal del user (precios sugeridos por AI), recompensas AI-propuestas, descuentos de partners
- **Earn power por racha** (no nivel): mayor racha → recompensas de mayor costo/importancia
- **3 mecánicas ortogonales**: nivel (status) / racha (earn power) / recompensas (motivación tangible)
- Tablas: `recompensas_catalog`, `user_wishlist`, `recompensas_otorgadas`, `user_streak`

### 3.8 Partner network (B2B)
- Marcas dan descuentos a cambio de exposure + métricas agregadas de cumplimiento
- Categorías: gyms, ropa deportiva, suplementos, clínicas, equipo, apps complementarias
- Outreach manual de Miguel pre-launch (target: 5-10 partners firmados)
- Converge con "Tratos Patrocinados" del spec v0.x

### 3.9 Nutrición (tier Pro)
- **Perfil nutricional**: tipo de dieta, padecimientos, alergias, restricciones
- **AI meal plan ADAPTIVE**: base mensual + weekly micro-adjustments. Cada domingo regenera próxima semana según feedback. ~6 generaciones/mes/user (~$1 USD/mes en Claude)
- **Output**: lista del super + macros + micronutrientes personalizados
- **Feedback interactivo**: like/dislike por item, "fue mucho/poco" → AI aprende preferencias
- **Logging**: marcar items del plan (default) + foto opcional para validación/aproximación de macros

### 3.10 Análisis corporal (tier Pro)
- **Foto opcional cuando user quiera** → Claude Vision → body composition (% grasa, % músculo) + postura + recomendaciones de rutina
- **Privacy doble**: foto baseline de onboarding se borra post-análisis; si user opta-in tracking mensual, esas se guardan en perfil privado (nunca al grupo, nunca a Miguel)

### 3.11 Estudios médicos (tier Premium · post-MVP)
- Upload PDF (sangre, hormonas, etc) → Claude OCR + parse → compara con rangos normales → flag + recomendación genérica ("considera consultar a especialista en X")
- SIN red de doctores específicos, SIN integración con labs (más simple, menos riesgo legal)

### 3.12 Health metrics integration (post-MVP)
- HealthKit (iOS) / Health Connect (Android) — requiere app nativa
- MVP: input manual

### 3.13 Notifications
- **Email + Push, granular por 5 tipos**: check-in reminder diario / cierre semanal / group activity / milestones personales / marketing
- Opt-out por tipo independiente + por canal (email/push) independiente
- Push PWA lock screen (MVP). Smartwatch (post-MVP)

### 3.14 Pricing (3 tiers)
- **Free**: auth + grupos + catálogo + check-ins + ciclos + character system + gamificación + **marketplace recompensas** + push
- **Pro** (~$99 MXN/mes): + AI meal plan adaptive + análisis corporal foto + macros detallado + recompensas Pro
- **Premium** (post-MVP): + estudios médicos + plans extra-personalizados con verificación profesional interna + prioridad cómputo
- **Stripe Checkout hosted** + trial 7 días + mensual/anual. Dos entry points: pricing page + paywall contextual
- **Trust layer interno**: Miguel manda rutinas/recomendaciones AI a coaches/médicos colaboradores para verificación offline (user nunca habla con coach)

### 3.15 Legal & compliance
- **Soft disclaimer** "no es advice médico" en onboarding + Términos + outputs AI
- Datos sensibles policy para estudios médicos (post-MVP)
- Privacy by architecture (core/pulse)

### 3.16 Competición entre dúos — "Hyrox para cualquier disciplina" (añadido 2026-06-03)

Coop dentro del dúo + competencia entre dúos. Detalle y fases en `docs/ROADMAP_COMPETITIVO.md`.

- **Estándar comparable**: los **puntos normalizados por BMR** (§3.4) hacen justa la
  comparación entre disciplinas distintas — el equivalente al formato fijo de Hyrox. Ya existe.
- **Dentro del dúo (coop, positivo)**: racha compartida por compliance (existe) + **boosts**
  que los miembros se regalan (x2 puntos un día, "energía"). Nunca mecánicas punitivas internas.
- **Entre dúos (competencia)**: **leaderboard** por puntos normalizados del periodo, **retos
  dúo-vs-dúo** (duelo de N días), y **power-ups/sabotajes** (congelar el multiplicador del rival)
  — **solo contra dúos rivales, jamás contra el propio partner**.
- **Verificación de presencia** (gating anti-trampa, escala por fase): confirmación opcional del
  dúo + foto efímera; **geo NO obligatoria** (fricción + privacy MX), reservada a duelos "ranked".
  Pasa de opcional a necesaria cuando hay ranking (la trampa afecta a otros) → además caps por sesión.
- **Unidad competitiva**: el dúo (el modelo soporta N>2; análogo a singles/dobles/relay de Hyrox).
- **Fases**: A motor (✅) → B leaderboard de dúos → C retos + boosts + verificación ligera →
  D ligas/divisiones/power-ups + verificación seria. La competencia es **acelerador, no cimiento**:
  validar primero que el loop + racha retiene con usuarios reales.

---

## 4 · UX / UI estructural

- **Home post-login = combo layout**: header 6 stats compactas (mini-bars) + sección "Hoy" + grupos lateral + CTA check-in prominente
- **Navegación**: hamburger menu mobile-only single column
- **Device**: MVP responsive, futuro mobile-first
- **Dark mode**: light + dark + manual toggle (auto-detect default)
- **Settings progresivo**: secciones se revelan según features usadas
- **Idioma**: in-app español neutro warm; class names MX flavor (brand quirk); marketing neutro internacional
- **Visual estética**: postponed (diseñador externo). Pilares en `feedback_dovofit_brand_direction.md` (hiperaspiracional, spatial UI, big type, video hero, shaders, body positive)

---

## 5 · Arquitectura técnica

### 5.1 Lo que sobrevive del v0.x
- ✅ Auth infra (cambia magic link → Google OAuth)
- ✅ Email transactional (Resend, templates adaptan)
- ✅ Pulse pipeline (edge function + bucketing; agregar dimensions: nivel, dieta_tipo)
- ✅ Schemas core/pulse base + RLS + grants
- ✅ Perfil/Ajustes UI base
- ✅ Legal docs (apéndice nutrición/salud)
- ✅ BRAND.md, icon.svg, opengraph-image, wordmark

### 5.2 Lo que se reemplaza
- ❌ `core.tratos.goal` (text) → catálogo de actividades + rutinas
- ❌ `core.tratos.duracion_dias` → ciclos semanales/mensuales continuos
- ❌ `core.tratos.creator_id + partner_id` → `core.trato_miembros` (N miembros)
- ❌ `core.checkins.cumplido boolean` → métricas estructuradas
- ❌ Streak grid de N días → grid de semanas + nivel mensual + character sheet
- ❌ Wizard goal libre → selector de catálogo + rutina

### 5.3 Modelo de datos nuevo (high-level)

```
core.users                  -- existe; agregar onboarded_at
core.user_perfil_fisico     -- NUEVO: peso, altura, edad, género, nivel_actividad, objetivo, experiencia, lesiones, bmr_calculado
core.user_perfil_nutricional-- NUEVO (Pro): dieta_tipo, padecimientos[], alergias[], restricciones[], kcal_target
core.actividades            -- NUEVO catálogo: nombre, modality, kcal_por_unidad, unidad, metricas_requeridas[], stats_afectados (jsonb)
core.tratos                 -- REWORK: id, nombre_grupo, tipo_grupo, estado, created_at (sin goal, sin duracion_dias)
core.trato_miembros         -- NUEVO: trato_id, user_id, joined_at, role
core.user_rutinas           -- NUEVO: miembro_id, nombre, is_default, is_travel, actividades (jsonb: actividad_id × frecuencia × duracion)
core.checkins               -- REWORK: id, miembro_id, ciclo_id, actividad_id, fecha, metricas (jsonb), kcal_calculadas, puntos
core.ciclos_semanales       -- NUEVO: id, trato_id, semana_inicio, semana_fin, estado, scores (jsonb)
core.user_character         -- NUEVO: user_id, fue, res, flex, vel, equ, vit (numeric), nivel, xp, prestige, class_name
core.user_streak            -- NUEVO: user_id, current_streak_weeks, max_streak, last_cumplido_week
core.recompensas_catalog    -- NUEVO: id, nombre, tipo, costo_estimado, partner_id, streak_min_required
core.user_wishlist          -- NUEVO: user_id, item_nombre, costo_estimado_ai
core.recompensas_otorgadas  -- NUEVO: user_id, recompensa_id, fecha, racha_alcanzada
core.partners               -- existe parcial (brand_partners); rework
core.subscriptions          -- NUEVO: user_id, tier, stripe_*, status, period_end
core.usernames              -- NUEVO: user_id, handle
core.notification_preferences-- NUEVO: user_id, tipo, email_on, push_on
pulse.eventos_agregados     -- existe; agregar dimensions nivel/dieta_tipo
```

---

## 6 · Fases de implementación

| Fase | Scope | Estimación |
|---|---|---|
| **F1 · Foundation refactor** | Google OAuth, borrar tratos v0.x, nuevos schemas core (perfil físico, actividades catálogo, trato_miembros, rutinas), onboarding 3 pantallas | 1-2 semanas |
| **F2 · Check-in + scoring** | Check-in con métricas, cálculo BMR + puntos, character stats update | 1-2 semanas |
| **F3 · Ciclos + gamificación** | Ciclos semanales/mensuales, niveles + XP + decay, class names AI, character sheet UI | 1-2 semanas |
| **F4 · Marketplace recompensas** | Wishlist + AI suggester + earn power por racha + redención | 1 semana |
| **F5 · Nutrición (Pro)** | Perfil nutricional, AI meal plan adaptive, logging, feedback loop | 2 semanas |
| **F6 · Análisis corporal (Pro)** | Foto upload + Claude Vision + privacy doble | 1 semana |
| **F7 · Pagos (Stripe)** | Pricing page, paywall, Checkout, subscriptions, feature gates | 1 semana |
| **F8 · Push notifications** | Service worker, Web Push, granular prefs | 1 semana |
| **Post-MVP** | Estudios médicos, health metrics native, smartwatch, partner network full | meses |

**MVP estable (F1-F8): ~10-12 semanas.**

---

## 7 · Out of scope MVP

- Estudios médicos (Premium post-MVP)
- Health metrics nativas (requiere app nativa)
- Smartwatch apps
- Sleep/recovery tracking (VIT solo nutrición en MVP)
- Partner network completo (marketplace funciona con wishlist personal sin partners al inicio)
- Coach humano (no existe — todo AI)
- Internacionalización i18n (MX-first, strings en variables para futuro)

---

## 8 · Decisiones tomadas (referencia rápida)

Las 41 decisiones viven en `project_dovofit_vision.md`. Cambios vs spec v0.x:
- Grupos: 2 estricto → sin límite
- Goal: texto libre → catálogo
- Duración: fija → continua/ciclos
- Check-in: binary → métricas
- Score: 0-1000 → character system RPG
- Onboarding: magic link → Google OAuth
- Recompensas: implícitas → marketplace core
- Nutrición: no existía → AI adaptive Pro
- Pricing: free 200 → 3 tiers con Stripe
