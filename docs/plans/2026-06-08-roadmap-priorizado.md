# ROADMAP PRIORIZADO — dovo features restantes

*Jefe de Gabinete · unificación de los 4 paneles (Retención/Hooked · CFO-CMO · Arquitectura/Riesgo · Diseño/UX)*

---

## La discrepancia central y cómo se resuelve

Los 4 paneles coinciden en **dos cosas con consenso total**: (1) Pulido Desktop + Onboarding va **primero**, sin excepción; (2) F6 Análisis corporal va **último**. La pelea es por las posiciones 2-3:

| Panel | Posición de F4 | Posición de F7 |
|---|---|---|
| Retención/Hooked | **#2** (antes de F7) | #4 |
| Diseño/UX | #3 (después de F7) | **#2** |
| CFO/CMO | #4 | **#2** |
| Arquitectura | **#2** | #3 |

**Criterio de desempate (explícito):** la pregunta no es "¿qué cierra mejor el loop?" (gana F4) ni "¿qué vende mejor al inversionista?" (gana F7). La pregunta correcta dado el contexto es: **¿qué pieza es FUNDACIONAL para todo lo que viene después, y cuál puede construirse encima sin retrabajo?**

Y ahí F7 gana por una razón arquitectónica que el panel de Arquitectura mismo identificó pero subordinó: **F7 no es una feature, es la infraestructura de gating sobre la que cuelgan F5 y F6.** El `useTier()` hook + el mapa `FEATURE_TIERS` configurable + el componente `<Paywall>` son prerrequisito de construir cualquier feature Pro sin retrabajo. Si construyes F5 Nutrición antes que el gate, construyes una feature huérfana que luego hay que re-cablear al paywall.

El argumento de Hooked (F4 cierra el Investment) es **correcto pero no urgente**: con 0 usuarios, el loop de retención que F4 cierra **no se puede medir todavía**. Estás invirtiendo en una pata del Hook que aún vale 0 en evidencia. F4 es self-contained y sin dependencias → tiene cero costo de oportunidad esperarlo a #3. F7 sí bloquea cosas.

**El desempate fino (decisión de Jefe de Gabinete):** F7 va #2 **como infraestructura de gating**, construido de forma que F4 pueda entrar #3 en paralelo sin fricción. Es el orden que satisface a CFO/CMO/UX (revenue temprano + paywall en el demo) Y al de Arquitectura (gate configurable antes que las features Pro) Y no le cuesta nada a Hooked (F4 sigue llegando temprano, #3, y se conecta a push en #5). El único panel que pierde posición es Hooked en su preferencia F4>F7 — y pierde por el criterio correcto: **monetizas y gateas la infra antes de invertir en un loop que aún no puedes medir.**

> ⚠️ **Condición que puede invertir #2 y #3:** si Miguel **NO** tendrá Stripe keys en las próximas ~3-4 semanas, el valor "willingness-to-pay real para el demo" se evapora (sólo queda sandbox). En ese caso F4 sube a #2 y F7 baja a #3 — porque entonces F4 (que SÍ se puede shippear 100% real sin keys) entrega más valor demostrable que un Stripe en sandbox. **Esta es la única pregunta que mueve el ranking. Pregúntasela a Miguel antes de empezar el #2.**

---

## ORDEN FINAL

```
0. Pulido Desktop + Onboarding   [S/M] · sin keys · DEMO-CRÍTICO, FUNDACIONAL
1. F7 Pagos (infra gating)        [M/L]· Stripe   · REVENUE + prerrequisito de F5/F6
2. F4 Marketplace recompensas     [M]  · sin keys · cierra Investment del Hook
3. F5 Nutrición IA                [L]  · Claude   · MONETIZADOR estrella (tier Pro)
4. F8 Push notifications (PWA)     [M]  · sin keys · Trigger recurrente del loop
5. F6 Análisis corporal           [M]  · Claude   · wow episódico, mayor riesgo
```

**Justificación de una línea por item:**

0. **Pulido Desktop + Onboarding** — Consenso unánime de los 4 paneles. Cero APIs, cero riesgo, y es el envoltorio sobre el que se ve todo lo demás; el inversionista abre el demo en laptop y hoy luce sparse. Máximo ROI/día.
1. **F7 Pagos** — No es feature, es la infraestructura de gating (prerrequisito de F5/F6) Y la evidencia de willingness-to-pay que un pre-seed valora más que cualquier proyección. Construir el gate como config rompe la falsa dependencia "F7 necesita F5".
2. **F4 Marketplace** — Cierra el Investment del Hook (la pata que falta hoy), self-contained, sin keys → riesgo nulo y material visual fuerte para el deck. Va #2 porque no bloquea nada y refuerza retención antes de invertir en el monetizador.
3. **F5 Nutrición IA** — El justificador del precio Pro ("¿por qué $139?"), uso diario que refuerza el loop. Va después del gate (#1) para no ser feature huérfana; antes de F6 porque es diario, no episódico.
4. **F8 Push** — El Trigger recurrente que reinicia el loop sin depender del email mensual. Va aquí porque amplifica retención que aún no tienes (0 usuarios) y se engancha a F4 ("tu duo desbloqueó X").
5. **F6 Análisis corporal** — Último por consenso: mayor fricción (foto), mayor riesgo de privacidad/percepción (datos biométricos MX), uso episódico → menor impacto en loop. Wow para demo pero el que menos mueve retención.

---

## DETALLE POR ITEM (en orden de construcción)

### 0. Pulido Desktop + Onboarding — `S/M` · riesgo BAJO · sin keys

**Scope MVP**
- **SÍ:** layout desktop de 2-3 columnas SOLO en el recorrido del demo (showcase → demo 1-tap → personaje 6-stats → check-in → leaderboard → retos). Personaje como héroe a la izquierda + stats a la derecha; leaderboard en tabla ancha (no lista mobile estirada). Skeleton loaders editoriales (no spinners genéricos) en esas vistas. Onboarding guiado 3-4 pasos, salteable: crear duo → primer check-in → ver personaje subir → entender el concepto "duo".
- **NO:** rediseño del sistema, refactor del motor, pulir vistas fuera del camino del demo, nuevos componentes desde cero. **Time-box duro: 4-5 días. Si se desborda a >1 semana, estás rediseñando — para.**

**Tablas/RPC:** ninguna.
**Pantallas (mobile-first):** todas las del recorrido autenticado existente, ahora con breakpoint desktop. Onboarding como overlay/sheet de pasos.
**Keys de Miguel:** ninguna.
**Fail-soft:** n/a.
**Esfuerzo:** S/M.

---

### 1. F7 Pagos (Stripe Checkout, infra de gating) — `M/L` · riesgo MEDIO · key: Stripe

**Scope MVP**
- **SÍ:** pricing page pública (Free 200 duos / Pro $139 / Premium $229), suscripción **por DUO** (no por user), Stripe Checkout hosted + webhook handler, hook `useTier()`, componente `<Paywall>` contextual (sheet, no página), y **mapa de gates configurable** `FEATURE_TIERS = { nutrition:'pro', body_scan:'pro', challenges:'free', ... }`. Regla de duo decidida ahora: **un duo = una suscripción; cualquiera de los dos paga; aplica a ambos.**
- **NO:** facturación por uso, prorrateo, multi-moneda, gestión de equipos/familias, gating de F5/F6 hardcodeado (debe ser config para que F5/F6 se registren con 1 línea).

**Tablas/RPC nuevas:** `subscriptions` (por `duo_id`, status, tier, stripe_customer_id, stripe_subscription_id, current_period_end). Webhook edge function para eventos Stripe (`checkout.session.completed`, `customer.subscription.updated/deleted`). RLS por duo.
**Pantallas (mobile-first):** pricing como cards apiladas con plan recomendado destacado; paywall como bottom-sheet contextual que muestra exactamente qué desbloquea + plan; badge Pro/Premium consistente en toda la app.
**Keys de Miguel:** **Stripe live keys.**
**Fail-soft para el demo:** flag `BILLING_ENABLED` (o `PAYMENTS_LIVE`). Sin keys live → pricing page se ve completa; botón "Suscribirme" abre modal "Próximamente / únete a la lista" (NO un Checkout roto); gates en **modo trust** (todo desbloqueado) controlado por flag; los 12 duos demo se muestran como "Pro" hardcoded para que el recorrido del inversionista jamás tope un 500. Miguel pega keys → flip a `true` → Checkout vivo y gates cobran. Cero código muerto.
**Esfuerzo:** M/L. Aristas: webhooks de estado por duo (qué pasa si un miembro cancela → la regla "uno paga, aplica a ambos" lo resuelve).

---

### 2. F4 Marketplace de recompensas — `M` · riesgo BAJO · sin keys

**Scope MVP**
- **SÍ:** wishlist personal (cada miembro del duo agrega items, se muestran lado a lado para reforzar el "duo"); recompensas que se **desbloquean por RACHA** (no por nivel — confirmado por todos los paneles); lógica determinista `racha_actual >= threshold → unlock`; UI con estados locked/unlocked + barra de progreso "te faltan N días para X". Tabla de descuentos de partners con **partners placeholder/propios** (mecánica lista, slot vacío hasta firmar partners reales).
- **NO:** integraciones con APIs de partners, canje real de cupones contra sistemas externos, marketplace transaccional. La mecánica de wishlist/racha es lo que se construye; los partners reales son contenido posterior con tracción.

**Tablas/RPC nuevas:** `rewards` (catálogo, threshold de racha), `wishlist` (por user), `reward_unlocks` (por duo), `partner_discounts` (placeholder). Lógica de unlock testeable, local.
**Pantallas (mobile-first):** tab nueva en nav inferior ("Recompensas" 🎁). Arriba: contador de racha del duo grande (gatillo emocional). Secciones scrolleables: "Desbloqueadas", "Próximas" (con progreso), "Wishlist" (lado a lado). Tab secundaria "Partners" como cupones canjeables con código. Desktop: grid de 3 columnas, racha como banner full-width.
**Keys de Miguel:** ninguna.
**Fail-soft:** n/a (partners = contenido sample, no fail-soft de key).
**Esfuerzo:** M.

---

### 3. F5 Nutrición con IA — `L` · riesgo MEDIO-ALTO · key: Claude API

**Scope MVP**
- **SÍ:** perfil nutricional (objetivo, restricciones, preferencias, presupuesto), meal plan semanal generado por Claude (lista del súper agrupada por pasillo + macros), ajuste **semanal** (no diario, por costo), logging diario local. Gateado a **tier Pro** vía el mapa de F7 (registro de 1 línea: `nutrition:'pro'`).
- **NO:** generación diaria (cara — usar cache + regeneración semanal), claims médicos, integración con bases de datos de alimentos externas en v1, escaneo de código de barras. Prompts conservadores + disclaimer "no es consejo médico".

**Tablas/RPC nuevas:** `nutrition_profiles`, `meal_plans` (cacheados por semana), `food_logs`. Edge function que llama a Claude (server-side, key nunca en cliente).
**Pantallas (mobile-first):** tab "Nutrición" con badge Pro (candado dorado para Free → dispara el `<Paywall>` de F7). Onboarding nutricional 4 pasos. Plan semanal como carrusel horizontal de días; CTA fijo "Lista del súper". Logging rápido con + flotante. Desktop: plan como grid 7-columnas tipo calendario.
**Keys de Miguel:** **Claude API key.**
**Fail-soft para el demo:** flag `NUTRITION_AI_LIVE`. Sin key → meal plan **sample DETERMINISTA hecho a mano** (3-4 plantillas reales por objetivo: déficit/mantenimiento/superávit, en español, macros de fórmula, NO lorem), con badge "plan base — activa IA para personalización". Ajuste semanal greyed con "Disponible al activar". Logging funciona siempre (local). Miguel pega key → generación adaptive real (~$1 USD/mes/user, COGS <15% del ACV — dato para el one-pager).
**Esfuerzo:** L. Mitigaciones: cache de planes, regeneración semanal no diaria, disclaimer.

---

### 4. F8 Push notifications (PWA) — `M` · riesgo MEDIO · sin keys de terceros

**Scope MVP**
- **SÍ:** service worker, suscripción Web Push con **VAPID keys auto-generadas** (no son de Miguel — self-served), prefs granulares (racha en riesgo, reto recibido, recompensa desbloqueada de F4, check-in del compañero). Prompt de permiso **contextual y bien timed** (después del primer check-in exitoso, NO al cargar). Engancha a F4: "tu duo desbloqueó una recompensa" es el push de mayor valor.
- **NO:** campañas masivas, segmentación avanzada, A/B de copys, push transaccional de pagos en v1.

**Tablas/RPC nuevas:** `push_subscriptions` (endpoint, keys por device), `notification_prefs` (por user). Edge function / scheduler para disparar pushes (racha en riesgo = cron diario).
**Pantallas (mobile-first):** sheet de permiso contextual que explica el valor ("te avisamos para no romper la racha del duo"); panel de toggles en Ajustes. Sin pantalla de feature propia.
**Keys de Miguel:** **ninguna** (VAPID self-served). Nota de plataforma: iOS PWA push requiere instalar a home screen + iOS 16.4+ → Android/desktop full, iOS best-effort.
**Fail-soft:** n/a (no depende de key de Miguel).
**Esfuerzo:** M. Fragilidad: service workers + permisos cross-browser.

---

### 5. F6 Análisis corporal — `M` · riesgo MEDIO-ALTO · key: Claude Vision

**Scope MVP**
- **SÍ:** foto **opcional** → Claude Vision → estimación % grasa/músculo + recomendaciones, como **estimación orientativa** con disclaimer fuerte. Doble consentimiento antes de subir. Borrado de foto **garantizado y auditable** (~60s), no best-effort. Gateado a Pro vía mapa de F7 (`body_scan:'pro'`).
- **NO:** tracking histórico de fotos almacenadas, comparaciones foto-a-foto guardadas (la foto se borra), claims de precisión clínica. Nunca procesar ni guardar foto en modo demo.

**Tablas/RPC nuevas:** `body_scans` (solo el RESULTADO numérico + timestamp, **nunca la foto**). Edge function Claude Vision con borrado garantizado post-inferencia.
**Pantallas (mobile-first):** no es tab; acción dentro del check-in o del perfil del personaje ("Escanear progreso"). Flujo modal full-screen: instrucciones de pose → captura → procesamiento con countdown visible de privacidad ("tu foto se borra en 60s") → resultado como tarjeta con % + barras vs check-in anterior + recomendaciones.
**Keys de Miguel:** **Claude API key (Vision).**
**Fail-soft para el demo:** flag `BODY_SCAN_LIVE`. Sin key → resultado **sample con foto stock + resultado ejemplo**, badge "Demo"; NUNCA procesa ni guarda foto del usuario en modo demo. Miguel pega key → análisis real.
**Esfuerzo:** M. Riesgo no-técnico ALTO: privacidad biométrica MX, expectativa de precisión, percepción invasiva → por eso va último, con la pipeline de Claude ya probada por F5.

---

## QUÉ SE PUEDE SHIPPEAR AHORA vs. QUÉ QUEDA "LISTO ESPERANDO KEY"

### Shippear AHORA, 100% real, sin tocar nada de Miguel
- **#0 Pulido Desktop + Onboarding** — cero dependencias. **Empieza esta semana.**
- **#2 F4 Marketplace** — self-contained (mecánica wishlist/racha real; partners = placeholder hasta firmar).
- **#4 F8 Push** — VAPID self-served, no necesita key de Miguel (sólo limitación de plataforma iOS).

### "Listo pero esperando key" (construir con fail-soft AHORA, se prende solo al pegar la key)
| Item | Key de Miguel | Estado sin key (demo nunca se rompe) |
|---|---|---|
| #1 F7 Pagos | Stripe live | Pricing visible + modal "próximamente" + gates en modo trust + 12 duos demo como "Pro". Flag `BILLING_ENABLED`. |
| #3 F5 Nutrición | Claude API | Meal plan sample determinista hecho a mano + badge "plan base". Flag `NUTRITION_AI_LIVE`. |
| #5 F6 Corporal | Claude API (Vision) | Resultado sample con foto stock + badge "Demo", nunca procesa foto real. Flag `BODY_SCAN_LIVE`. |

**Patrón fail-soft uniforme (mismo contrato que monthly-summary hoy):** un flag por feature (`X_LIVE`), fallback = sample real hecho a mano (nunca lorem, nunca 500). El recorrido del inversionista jamás topa un estado roto.

**Decisión arquitectónica que ata todo:** construir F7 (#1) con el **gate como mapa de configuración**, no hardcoded. Registrar una feature Pro = 1 línea en `FEATURE_TIERS`. Esto rompe la falsa dependencia "F7 necesita F5/F6" y permite que F5 (#3) y la infra de F7 (#1) avancen sin bloqueo mutuo.

---

## PRIMER PASO CONCRETO PARA EMPEZAR YA

**Hoy, dos acciones en paralelo:**

1. **Pregunta-bloqueante a Miguel (1 mensaje):** *"¿Cuándo tienes las Stripe keys live? ¿Y la Claude API key?"* — la respuesta a Stripe es lo único que puede invertir #1↔#2. Si Stripe está a >3-4 semanas, sube F4 a #2 y baja F7 a #3.

2. **Arranca #0 (Pulido Desktop) sin esperar respuesta** — no depende de nadie. Primer commit concreto: **convertir el dashboard del duo autenticado de columna mobile-centrada a grid desktop de 2-3 columnas** (personaje-héroe izquierda + stats derecha) con un breakpoint `lg:`, y meter skeleton loaders en esa vista. Es el cambio de mayor impacto visual por línea y desbloquea la conversación con inversionistas de inmediato. Time-box: 4-5 días para todo el #0.

---

**Hooked score del roadmap: 9/10.** Cierra los 4 fases del Hook (Trigger: onboarding #0 + push #4; Action: check-in ya existe, simplificado por #0; Variable Reward: stats/nivel ya existen + F4 #2; Investment: F4 wishlist #2 + F5 perfil nutricional #3). −1 punto porque el loop no se puede *medir* hasta tener usuarios reales: la prioridad #1 después de shippear este roadmap es **habit testing** (regla del 5%) con los primeros Free 200 duos para validar que el Investment de F4 realmente trae a la gente de vuelta.