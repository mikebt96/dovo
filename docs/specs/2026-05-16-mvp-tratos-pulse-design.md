# dovo MVP — Spec de Diseño

**Versión** 0.1 · 2026-05-16
**Estatus** Borrador para revisión de Miguel
**Scope** MVP launch · free para primeros 200 usuarios · sin custodia de dinero

---

## 1 · Contexto y propósito

dovo es una herramienta de tratos entre dos personas. Cualquier dúo — parejas, amigos, hermanos, roomies, gym buddies, rivales — define un trato (un goal compartido con duración) y se hace responsable de cumplirlo bajo accountability mutua.

El MVP **NO maneja lana de usuarios**. Manejar dinero en MX requiere licencia IFPE de la CNBV (12–18 meses) o partner regulado (SOFOM/SOFIPO). Ambas opciones están fuera del scope del MVP. El skin-in-the-game se ejecuta socialmente: rachas visibles, recompensa/castigo custom acordado entre el dúo, score público.

El MVP tiene **tres pilares** que se construyen simultáneamente:

1. **Tratos Sociales** — lo que el usuario ve y usa (B2C, free 200)
2. **Tratos Patrocinados** — la capa B2B opcional (marcas patrocinan tratos con recompensas no-monetarias)
3. **Pulse DOVO** — la capa invisible de inteligencia conductual agregada (privacy-by-architecture, valor institucional Año 2+)

El MVP valida tres hipótesis al mismo tiempo:
- H1 · ¿la gente hace y termina tratos con accountability puramente social?
- H2 · ¿alguna marca paga por patrocinar tratos como inventario de atención cumplida?
- H3 · ¿el dataset agregado de cumplimiento es interesante para una institución (banco, aseguradora, retail, academia)?

---

## 2 · Constraints duros

- **Sin custodia de dinero**: ni escrow, ni bóveda, ni payouts en lana real. Fin.
- **Free tier**: 200 usuarios sin costo de suscripción. Métrica de éxito ≠ cobrar; es validar uso.
- **MX-first**: español MX coloquial. Lenguaje permitido: trato/reto/apuesta/dúo. Prohibido: pacto/compromiso/juramento/alianza.
- **Stack**: Next 15 (app router) + Tailwind v4 + Supabase (auth, BD, storage, edge functions). Sin nuevas dependencias mayores sin justificación.
- **Privacy by architecture**: la base de tratos individuales y la base de agregados (Pulse) viven en schemas separados con keys no relacionables. INAI-ready desde día 1.

---

## 3 · Pilar 1 · Tratos Sociales (lo que ve el usuario)

### 3.1 Mecánica core

Un trato tiene:
- **Dúo** · dos usuarios DOVO (uno crea, el otro acepta vía link/invite)
- **Goal** · texto libre ("gym 3× por semana", "estudiar 30 min al día", "no fumar")
- **Cumplimiento** · cómo se mide (frecuencia + período · ej. 3× por semana × 8 semanas, o 1× al día × 21 días)
- **Recompensa custom** · texto libre acordado por el dúo ("el que cumpla elige peli", "ganador no lava trastes una semana")
- **Castigo custom** · texto libre acordado por el dúo ("el que falle paga el café", "el que falle cocina 3 cenas")
- **Cómo se ejecuta recompensa/castigo** · *fuera de la app*. El dúo se confía. dovo solo registra el resultado.

### 3.2 User flow del MVP

1. **Sign up** · email + nombre (sin teléfono, sin KYC, sin foto obligatoria)
2. **Crear trato** · 3 pantallas: qué van a hacer, cuánto tiempo, recompensa/castigo custom
3. **Invitar a dúo** · link único compartible por WhatsApp/iMessage. La otra persona acepta y se crea cuenta si no la tiene.
4. **Check-in** · cada quien marca cumplimiento del día/semana. Visible al otro en tiempo real.
5. **Streak visible** · grid de días, marcados/perdidos, racha actual
6. **Resolución** · al cierre del período, ambos confirman quién cumplió. Si hay disputa, queda como "sin resolver" (DOVO no arbitra).
7. **Score público** · cada usuario tiene un score de cumplimiento agregado de todos sus tratos. Es la vanity metric que crece con cada trato cerrado.

### 3.3 Pantallas a construir

| # | Pantalla | Prioridad |
|---|---|---|
| 01 | Onboarding (3 pasos · qué es dovo, hacer dúo, primer trato) | P0 |
| 02 | Home / mis tratos activos | P0 |
| 03 | Crear trato (3 pasos · goal, cumplimiento, recompensa/castigo) | P0 |
| 04 | Invitar a dúo (link compartible) | P0 |
| 05 | Vista de trato activo (streak, check-in, perfil del otro) | P0 |
| 06 | Resolución de trato (cumplido, fallido, disputa) | P0 |
| 07 | Mi perfil + score | P1 |
| 08 | Ajustes (incluye opt-out de Pulse DOVO) | P0 |
| 09 | Notificaciones (web push + email) | P1 |
| 10 | Onboarding del partner / Tratos Patrocinados (vista del usuario) | P2 |

### 3.4 Esquema de BD (simplificado)

```sql
-- Usuarios
users (id, email, nombre, created_at, pulse_opt_out boolean default false)

-- Tratos
tratos (
  id, creator_id, partner_id,
  goal text, frecuencia text, duracion_dias int,
  recompensa_text, castigo_text,
  estado enum('pendiente_aceptacion', 'activo', 'cerrado', 'disputado'),
  resultado enum('ambos_cumplieron', 'uno_fallo', 'ambos_fallaron', 'sin_resolver') null,
  created_at, accepted_at, closed_at,
  sponsored_id null references sponsored_tratos(id)  -- pilar 2
)

-- Check-ins
checkins (id, trato_id, user_id, fecha, cumplido boolean, nota text)

-- Score público
user_scores (user_id, tratos_cerrados int, tratos_cumplidos int, score_publico int)
```

---

## 4 · Pilar 2 · Tratos Patrocinados (B2B layer)

### 4.1 Concepto

Una marca patrocina un trato definido por la marca. Usuarios que acepten ese trato y lo cumplan reciben una recompensa no-monetaria de la marca (cupón, descuento, producto físico, acceso). La marca paga a dovo una sponsorship fee fija + un costo variable por trato cumplido.

**dovo nunca toca la lana del usuario.** El user money flow no existe — solo brand-to-dovo (factura SAT normal) y brand-to-user (códigos digitales).

### 4.2 Ejemplos concretos

| Marca | Trato patrocinado | Recompensa | Lo que paga la marca |
|---|---|---|---|
| Decathlon MX | "Trato Runner · 30 días, 3× por semana" | Cupón 20% off productos | Setup $30k MXN + $50/trato cumplido |
| Innovasport | "Trato Gym Buddies · 8 semanas, 3× por semana" | Acceso clase grupal gratis | Setup $25k MXN + $40/trato cumplido |
| Bimbo Wellbeing | "Trato Hábitos Saludables · 21 días · empleados Bimbo" | Producto físico Bimbo wellness | Tarifa corporativa anual $300k+ |
| Liverpool Wellness | "Trato Familiar · padres + hijos · 30 días lectura" | Tarjeta de regalo $200 MXN | Setup $40k + $80/trato cumplido |
| Innova Schools | "Trato Estudio · papá/mamá + hijo · 14 días" | Inscripción descuento | Setup $20k + co-marketing |

### 4.3 User flow del Tratos Patrocinados

1. Usuario ve un trato patrocinado en su home (banner con la marca)
2. Acepta el trato (debe invitar a un dúo o usar uno existente)
3. Cumple normalmente
4. Al cierre con resolución positiva, recibe el código digital de la marca (email + in-app)
5. Canjea fuera de DOVO

### 4.4 Outreach pre-launch (lista priorizada)

10 marcas para mandar cold email **antes** del launch (objetivo: cerrar 1):

1. **Decathlon MX** — wellness MKT director — ángulo: comunidad fitness MX con accountability
2. **Innovasport** — director digital — ángulo: same
3. **Bimbo Wellbeing** — RH/wellness corporativo — ángulo: programa de hábitos saludables para sus 130k empleados MX
4. **Cemex Wellness** — RH/cultura — same, 16k empleados MX
5. **Liverpool Wellness** — programa familias — ángulo: tratos padre/madre/hijo
6. **BBVA Mujer** — wellness + ahorro — ángulo: tratos de ahorro (sin custodia, solo trackeable)
7. **Innovasport corporativos** — programas wellness B2B
8. **AT&T Wellness MX** — RH — same que Bimbo/Cemex
9. **Coppel Salud** — ángulo: programa de hábitos para clientes
10. **Volaris / Aeromexico** — programa miles + accountability de viajes

Cada cold email debe mencionar:
- Concepto en 1 párrafo
- Costo CPM equivalente (más barato que un ad en IG)
- Métrica: solo paga por trato **cumplido** (mejor que CTR)
- CTA: 30 min call

**Métrica de éxito del outreach pre-launch**: 1 de 10 que firma un contrato piloto antes del launch público.

### 4.5 Esquema de BD

```sql
sponsored_tratos (
  id, brand_id, brand_logo_url,
  goal_template, frecuencia, duracion_dias,
  recompensa_descripcion, recompensa_tipo enum('cupon', 'producto', 'acceso', 'tarjeta_regalo'),
  setup_fee_mxn, per_completion_fee_mxn,
  estado enum('activo', 'pausado', 'cerrado'),
  fecha_inicio, fecha_fin,
  cap_usuarios int null
)

brand_partners (id, nombre, contacto_email, rfc, created_at)

reward_codes (id, sponsored_trato_id, codigo text, redeemed_by user_id null, redeemed_at)
```

---

## 5 · Pilar 3 · Pulse DOVO (la capa invisible)

### 5.1 Qué es

Un sistema de inteligencia conductual agregada. Cada trato cerrado contribuye señales anónimas a un dataset que **nunca contiene registros individuales identificables**. El usuario no lo ve (excepto un toggle de opt-out en Ajustes). Las instituciones lo verán como producto Año 2+.

### 5.2 Qué se captura (y qué no)

**SÍ se captura (anónimo, agregado):**
- Categoría del trato (fitness, ahorro, hábitos, aprendizaje, relación, otro — clasificado por NLP simple)
- Duración del trato (en días)
- Tasa de cumplimiento (% de check-ins exitosos)
- Cohorte demográfica del dúo (rango de edad, ciudad nivel CDMX/GDL/MTY/otras — NUNCA dirección)
- Día de la semana / hora típica de check-in (anonimizado)
- Si fue un Trato Patrocinado (sí/no) y de qué categoría de marca

**NO se captura:**
- El texto literal del goal del trato
- El texto literal de recompensa/castigo
- Nombres, emails, IDs de usuario
- Conversaciones / contenido íntimo
- Geolocalización precisa
- Datos de pago

### 5.3 Privacy mechanics (técnico)

**a) Schema separado**

Las tablas de tratos individuales (`tratos`, `checkins`, `users`) viven en un schema PostgreSQL llamado `core`. Las tablas de Pulse viven en un schema separado llamado `pulse` con **una BD lógica distinta** (otra connection string, otro role). El service-role-key de `pulse` no puede leer `core` ni viceversa.

**b) Ingestion via edge function con DP**

Cada vez que un trato se cierra, una edge function `ingest_pulse_event()` transforma el evento individual en una señal agregada con ruido diferencial (epsilon = 1.0, suficiente para queries de cohorte sin re-identificación).

```typescript
// supabase/functions/ingest-pulse-event/index.ts
async function ingestPulseEvent(trato_id) {
  const trato = await fetchTrato(trato_id) // de schema core
  const evento = {
    categoria: classifyCategoria(trato.goal), // NLP, no guarda goal
    duracion_dias_bucket: bucketize(trato.duracion_dias, [7, 14, 30, 60, 90]),
    tasa_cumplimiento_bucket: bucketize(tasaCumplimiento(trato), [0.2, 0.5, 0.8, 1.0]),
    cohorte_edad: bucketize(edadDelDuo(trato), [25, 35, 45, 55]),
    cohorte_ciudad: cityToBucket(trato), // CDMX / GDL / MTY / otras
    es_patrocinado: !!trato.sponsored_id,
    dow_creacion: trato.created_at.getDay()
  }
  await insertIntoPulse(evento) // schema pulse, sin trato_id ni user_id
}
```

**c) k-anonymity en las queries**

Toda query del Pulse Console (cuando se construya en Año 2) pasa por una capa que **rechaza queries cuya cohorte resultado sea < 100 personas**. Si la query pide "fitness · CDMX · 25–35 años · 7 días" y eso devuelve 87 personas, la respuesta es `null + razón: "cohorte insuficiente"`.

**d) Auditoría**

Cada query del Pulse Console (cuando exista) se logea con: who, what, when, response_size. Reportes públicos trimestrales como [Apple Transparency Report] desde el inicio.

### 5.4 Opt-out UX

En **Ajustes → Privacidad** hay un toggle:

> **"Contribuir a estadísticas anónimas"** *(ON por default)*
> dovo genera estadísticas agregadas sobre cómo la gente hace y cumple tratos. Estas estadísticas nunca identifican a una persona individual. [Más detalles](#)

Al apagar el toggle, los tratos futuros del usuario **no se ingieren a `pulse`**. Los datos previos ya agregados no se pueden quitar (por arquitectura no se pueden ligar a un user).

### 5.5 TOS language (borrador)

> *Sección 6 · Estadísticas Anónimas Agregadas*
>
> *dovo genera estadísticas agregadas sobre patrones de cumplimiento de tratos en su plataforma. Estas estadísticas:*
>
> *a) Nunca incluyen información personal identificable (nombre, email, contenido del trato, recompensa o castigo).*
> *b) Solo incluyen señales en cohortes de 100 personas o más.*
> *c) Pueden ser publicadas en reportes, compartidas con socios académicos, o eventualmente licenciadas a terceros con fines de investigación o intelligence sectorial.*
> *d) Pueden ser desactivadas por el usuario en Ajustes → Privacidad. Al hacerlo, sus tratos futuros no contribuyen al dataset agregado. Los datos previamente agregados no son reversibles por arquitectura.*
>
> *dovo opera bajo las disposiciones de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y mantiene reportes trimestrales públicos sobre el uso del dataset agregado.*

Validar con abogado de privacidad (~$15k MXN setup + $5k/año mantenimiento).

### 5.6 Outreach Año 1 (PR gratis, no revenue todavía)

Antes de monetizar Pulse, dar acceso gratis a:

1. **TEC de Monterrey · School of Government** — research behavioral economics MX
2. **ITAM · Centro de Investigación Económica** — same
3. **UNAM · Instituto de Investigaciones Sociales** — same

Cada acuerdo:
- Acceso a queries agregadas gratis a cambio de
- Co-publicación de un paper / reporte trimestral
- Mención de dovo como fuente del dataset
- **Resultado**: 3 papers académicos en Año 1 con dovo como fuente = social proof brutal para el pitch de Año 2 a Aseguradoras/Fintech

### 5.7 Esquema de BD

```sql
-- Schema 'pulse' (separado de 'core'), service role distinto
pulse.eventos_agregados (
  id, ingested_at,
  categoria text,
  duracion_dias_bucket text,
  tasa_cumplimiento_bucket text,
  cohorte_edad text,
  cohorte_ciudad text,
  es_patrocinado boolean,
  dow_creacion int
  -- NUNCA: user_id, trato_id, contenido, nombres
)
```

---

## 6 · Métricas de éxito del MVP

**Hipótesis 1 · ¿la gente hace y termina tratos con accountability social?**
- KPI primario: **% de dúos que cierran al menos 1 trato** (no inscripción, no creación — cierre formal con resolución)
- Meta: 60% de los 200 free
- KPI secundario: tratos promedio por dúo en 90 días
- Meta: ≥1.8

**Hipótesis 2 · ¿alguna marca paga por patrocinar tratos?**
- KPI primario: 1 brand contract firmado en los 90 días post-launch
- KPI secundario: pipeline de 3+ brands en conversaciones avanzadas

**Hipótesis 3 · ¿el dataset agregado es interesante a una institución?**
- KPI primario: 1 institución académica firmando acceso gratuito en 90 días post-launch
- KPI secundario: 1 conversación abierta con un CVC (Nu, BBVA Spark, Banorte Spark) basada en el deck del dataset

---

## 7 · Arquitectura técnica

### 7.1 Stack

- Frontend: Next 15 (app router) + Tailwind v4
- Backend: Supabase (auth, postgres, edge functions, storage, realtime)
- Hosting: Vercel
- Email: Resend (transactional)
- Notificaciones push: Web Push API (sin app nativa en MVP)
- Analytics: PostHog (eventos del producto, NUNCA conectado al schema pulse)
- Error tracking: Sentry

### 7.2 Modelo de datos (high-level)

Dos schemas separados:
- `core` · users, tratos, checkins, user_scores, sponsored_tratos, brand_partners, reward_codes
- `pulse` · eventos_agregados (sin keys que liguen a core)

Edge function única `ingest-pulse-event` con role limitado que solo puede leer agregados de `core` (vía función de stored procedure con permission control) y escribir a `pulse`.

### 7.3 Auth

Supabase Auth con email + magic link. Sin teléfono, sin SMS, sin biometría — MVP simple.

### 7.4 Push notifications

Web push only en MVP. Si validamos retention, native apps en v0.2.

---

## 8 · Build sequence (orden de construcción · 12 semanas)

| Semana | Entregable |
|---|---|
| 1–2 | Schema de BD (core + pulse separados desde día 1), auth, sign up |
| 3 | Pantalla 01 Onboarding + Pantalla 02 Home |
| 4 | Pantalla 03 Crear trato + Pantalla 04 Invitar dúo |
| 5 | Pantalla 05 Trato activo + check-ins + streak grid |
| 6 | Pantalla 06 Resolución + Pantalla 07 Perfil/score |
| 7 | Ajustes + opt-out de Pulse + TOS legal · enviar a abogado |
| 8 | Edge function `ingest-pulse-event` + DP + tests + auditoría |
| 9 | Notificaciones push + email transactional |
| 10 | Tratos Patrocinados schema + 1 patrocinador piloto integrado (P2 si no hay marca firmada) |
| 11 | QA + bug bash + privacy audit interno |
| 12 | Soft launch a 50 dúos beta · medir antes de abrir a 200 |

Tratos Patrocinados puede partir como **P2** (post-soft-launch) si en la semana 10 no hay marca firmada. No bloquea el lanzamiento del MVP B2C.

---

## 9 · Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Los 200 free no llegan a 1 trato cerrado | Media | Onboarding fuerte, copy de "primer trato" muy claro, recordatorios día 1/3/7 |
| Ninguna marca firma en 90 días | Media-alta | Pilar 2 es opcional. Si nadie firma, el MVP sigue válido como validación de H1 y H3 |
| El usuario percibe Pulse como "venden mis datos" | Baja-media | Comunicación pre-launch explicando privacy-by-architecture, blog post técnico, opt-out muy visible |
| INAI / regulación nueva en 2026 | Baja | Pulse está diseñado para cumplir LFPDPPP reforma 2025. Si endurece más, k-anonymity ≥ 100 y DP cubren la mayoría de escenarios |
| Tratos con datos sensibles (salud mental, peso) | Media | TOS prohíbe trato sobre datos sensibles sin consentimiento expreso del dúo. Flagging por NLP de keywords. |
| Disputa entre dúo (uno dice "cumplí", otro dice "no") | Alta | dovo NO arbitra. Estado "disputado" registrado, no afecta score público, queda como caso edge sin resolver |

---

## 10 · Lo que NO es scope del MVP

(Para Año 2+, después de validación)

- Custodia de dinero · Bóveda · escrow
- Trato API pública para partners (Strava/Platzi/Nu integration)
- Pulse Console B2B (la herramienta para que aseguradoras/fintech consulten)
- Trato Score como signal de underwriting
- Native apps iOS/Android
- Internacionalización fuera de MX
- Modo Coach / terapeutas / RH corporativos como cuentas dedicadas
- Crypto / blockchain / web3
- Disputas con arbitraje
- Verified credentials (W3C VC)

Cualquier discusión de estos features queda capturada en una sección de Roadmap, no en el MVP.

---

## 11 · Decisiones abiertas (necesitan respuesta de Miguel antes del kickoff)

1. ¿El score público es realmente público (cualquiera lo puede ver) o solo visible para dúos que comparten un trato?
2. ¿Permitimos tratos entre más de 2 personas en el MVP, o estrictamente dúos? (Voto fuerte por dúos estrictos en MVP)
3. ¿El check-in es self-report o necesita validación del otro miembro del dúo? (Voto por self-report en MVP, validación es feature de v0.2)
4. ¿Los 200 free son orden de llegada o curados (early access list)? (Voto por curados — control de cohorte para validación)
5. ¿Web only o también algún wrap iOS rápido tipo PWA (Add to Home Screen)? (Voto por PWA bien hecha — sin nativo todavía)

---

*fin del spec · v0.1 · 2026-05-16*
