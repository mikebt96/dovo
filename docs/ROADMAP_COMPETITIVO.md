# dovo — "Hyrox para cualquier disciplina"

**Dirección de producto (2026-06-03, decidida por Miguel):** coop-interno + competitivo-externo.
Tú y tu dúo entrenan SU disciplina, coordinados; y compiten de forma estandarizada
contra otros dúos. *"Entre ambos se retan y se motivan."*

## La tesis

Hyrox estandariza el **formato** (8 estaciones + 8 km, igual para todos) para que dos
personas distintas sean comparables. dovo no puede fijar el formato — cada quien hace su
deporte (gym, running, pilates, ballet, natación…). Su estándar es otro:

> **El esfuerzo normalizado por BMR es el "formato Hyrox" de dovo.** Un check-in de
> pilates y uno de gym valen lo mismo si cuestan el mismo esfuerzo *relativo al cuerpo
> de cada quien*. Eso hace justa la competencia entre disciplinas distintas.

**Esto ya existe** (F2, `calcularPuntos = kcal / (bmr/1440)`). Es el diferenciador y la
pieza más difícil — ya está en producción. Falta construir la capa competitiva encima.

## El modelo: coop dentro, competencia fuera

| | Dentro del dúo (coop) | Entre dúos (competencia) |
|---|---|---|
| **Mecánica** | racha compartida, boosts/energía que se regalan | leaderboard, retos dúo-vs-dúo, power-ups |
| **Tono** | positivo, "ambos aparecen" | "se retan", sano, tipo clan/liga |
| **Hook** | Investment (la racha que no quieren romper) | Variable Reward (¿ganamos el duelo?) + Tribe |
| **Ya construido** | ✅ F3b racha del dúo por compliance | ❌ por construir |

Regla de oro (del análisis hooked-ux): los "golpes/congelamientos" van **entre dúos
rivales, nunca contra tu propio partner** — atacar a tu pareja erosiona el "juntos".
Dentro del dúo solo cosas positivas (boosts). Es el modelo Clash of Clans / Strava clubs:
cooperas con tu clan, compites contra otros.

## Fases (conectadas con lo ya construido)

**Fase A — el motor (✅ hecho, en prod):**
loop check-in → puntos normalizados por BMR → stats/nivel/clase → racha del dúo por
compliance + resumen mensual. *El estándar comparable ya existe.*

**Fase B — Leaderboard de dúos (siguiente, mínimo viable competitivo):**
ranking de dúos por puntos normalizados del periodo (semana/mes). Es la competencia
externa más simple: solo rankear lo que ya medimos. Prueba la hipótesis competitiva con
poco código. *Requiere: tener ≥ varios dúos activos para que el ranking signifique algo.*

**Fase C — Retos dúo-vs-dúo + boosts internos:**
un dúo reta a otro a un duelo de N días (quién suma más puntos normalizados). Variable
reward directo. + boosts que los miembros se regalan dentro del dúo (x2 puntos un día,
"energía"). Aquí la **verificación** deja de ser opcional → confirmación del dúo + foto
efímera (geo solo para duelos "ranked", opcional).

**Fase D — Ligas / divisiones / power-ups:**
matchmaking por nivel/objetivo (que compitan parejo, como las categorías de Hyrox),
temporadas, y power-ups competitivos ligeros (congelar el multiplicador del rival un día).
Verificación seria. Solo tiene sentido con masa de usuarios.

## Decisiones abiertas
- ¿La unidad competitiva es el **dúo** o también **grupos N>2**? (el modelo soporta N;
  Hyrox tiene singles, dobles y relay).
- Periodo del leaderboard: semanal (más adrenalina) vs mensual (alineado al resumen).
- Verificación: confirmación-del-dúo vs foto vs geo — qué nivel por fase (B sin, C ligera, D seria).
- Anti-trampa: en cuanto hay ranking, el incentivo a inflar puntos sube → la verificación
  y/o caps por sesión se vuelven necesarios.

## Riesgo de secuencia
dovo tiene **0 usuarios reales** hoy. Las Fases B-D necesitan masa (un leaderboard con un
dúo no es nada). **Validar primero que el loop + racha del dúo retiene** (Fase A con users
reales) antes de invertir en competencia. La competencia es el acelerador, no el cimiento.
