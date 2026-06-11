# nutrición v2 + plan de dúo · spec del founder (2026-06-10)

Directivas de Miguel, capturadas verbatim y traducidas a ejecución. Complementa
la directiva del consejo (2026-06-10-game-design-directive.md) — TODO lo de
abajo se construye con su lenguaje: Mesa Nocturna, ceremonias, recibo, voz MX.

## Principios (del founder, innegociables)

1. **Es un videojuego y debe sentirse como tal en TODO**: UX, UI y la
   comunicación (copy, pushes, emails). El tono se calibra **por edad** del
   jugador (la edad ya vive en `user_perfil_fisico.edad`): más lúdico-retador
   para 18-30, más coach-cómplice para 40+. Jamás corporativo, jamás clínico.
2. **El objetivo del juego**: que AMBOS se motiven para alcanzar sus metas y
   lleguen a un MISMO objetivo — cooperativo siempre, con retos entre ellos.
3. **Los planes los damos NOSOTROS** (entrenamiento y nutrición). El jugador no
   llega a una hoja en blanco: llega a su plan.
4. **Mock-first, AI-ready**: todo lo que requiera IA se construye AHORA con
   motores deterministas (mocks production-ready) detrás del MISMO contrato que
   la IA. Las API keys se conectan después por cliente vía env
   (patrón existente: `NUTRITION_AI_LIVE` / `WORKOUT_AI_LIVE` + key — pegar la
   key ENCIENDE la personalización sin tocar código).

## Entrenamiento

- **Gym / running**: dovo PRESCRIBE el esquema — por nivel, por grupo muscular,
  por objetivo, por frecuencia (F9 ya hace gym: splits fullbody/PPL/UL +
  esquemas por objetivo; running básico existe — ampliar esquemas por nivel
  principiante/intermedio/avanzado con progresión de volumen).
- **Clases (pilates, ballet, etc.)**: NO podemos poner la rutina (la pone la
  clase). Solo se VALIDAN:
  - hoy: candado del lugar (F15 — ancla + sello). ✓ SHIPPED
  - fase nativa: métricas de salud del reloj/celular (HealthKit / Health
    Connect) para detectar la sesión (tipo de workout, duración, FC). ⚠️ El
    navegador móvil NO puede leer HealthKit/Google Fit — esto entra con las
    apps nativas del roadmap. NO prometerlo en UI antes de eso (regla 16 del
    consejo: cero promesas sin mecánica).

## Nutrición v2

### Wizard (primera vez — lo que preguntaría un nutriólogo del deporte)
Extiende `nutrition_profiles`. Preguntas (toda la UI como personaje del juego,
no formulario clínico):
1. ¿Cuántos **menús distintos** debe crear la app para ti? (3 / 5 / 7 — rota
   sobre la semana)
2. Peso, altura, edad, género → ya viven en `user_perfil_fisico`; el wizard los
   CONFIRMA, no los re-pregunta (un nutriólogo revisa la báscula, no te hace
   llenar dos veces).
3. Objetivo (ya existe) + nivel de actividad (ya existe).
4. **Presupuesto aproximado** (bajo / medio / alto, o $ semanal MXN) — el menú
   se arma con ingredientes dentro del presupuesto.
5. **Tipo de dieta**: omnívora / vegetariana / vegana / keto / sin gluten /
   sin lactosa / etc.
6. Alergias y vetos iniciales ("no me gusta el brócoli").
7. Comidas por día (3 / 4 / 5).

### El menú semanal (la pantalla)
- **Lunes a domingo en menús desplegables** (accordion por día, estilo Mesa
  Nocturna — el día como card de juego).
- Cada comida y cada alimento lleva **palomita gustó / no-gustó**:
  - 👍 → se queda y el motor lo favorece.
  - 👎 → **se cambia EN AUTOMÁTICO** ese alimento por una alternativa
    equivalente (mismas kcal/macros aprox, mismo presupuesto, misma dieta) y el
    veto se RECUERDA (no vuelve a aparecer en ningún menú futuro).
- El swap es capa S del contrato de motion (chip nuevo entra con anim-chip-in).

### Motor (mock-first)
- Determinista: catálogo MX de alimentos con kcal/macros/costo aprox/tags de
  dieta (extiende `lib/nutrition/sample-plans.ts`). Generación = elegir N menús
  distintos que cumplan kcal objetivo + dieta + presupuesto + vetos; rotar L-D.
- Contrato único `generarMenuSemanal(perfil, prefs): PlanSemanal` con dos
  implementaciones: `sample` (hoy) y `ai` (gated por `NUTRITION_AI_LIVE` +
  `ANTHROPIC_API_KEY` — ya existe el patrón). El swap igual: `swapAlimento()`
  sample hoy, AI después. Pegar keys = personalización por cliente, cero deploy.

## Plan de DÚO (la regla de oro)

- **Un solo plan para los dos, dosis de cada quien.** Mismo menú (misma lista
  del súper, misma cocina) y misma rutina, ESCALADOS por persona:
  - nutrición: si a Miguel le tocan 2000 kcal y a Andrea 1700, MISMOS platillos
    con porciones/gramajes ajustados a cada uno (factor = kcal_objetivo
    individual / kcal base del menú).
  - entrenamiento: MISMA rutina (mismos días, mismos ejercicios) con
    cargas/volumen por nivel de cada quien (la progresión F9 ya es individual).
- Generación a nivel TRATO: cuando ambos miembros tienen perfil, el motor
  genera UNA estructura compartida + dos dosificaciones. Si solo uno tiene
  perfil, plan individual con invitación al compa ("el plan sabe mejor de a
  dos").
- UI: en el menú del día, toggle «tú / {compa}» que cambia SOLO los gramajes —
  el platillo es el mismo (eso ES el juego cooperativo en la mesa).

## Orden de ejecución propuesto

1. Migración: `nutrition_profiles` + columnas (menus_distintos, presupuesto,
   dieta_tipo, vetos text[], comidas_dia) · `meal_plans` por semana ya existe.
2. Motor sample v2 (catálogo con costo+tags, generador con vetos/presupuesto,
   swap determinista) + contrato AI-ready.
3. Wizard (reusa NutritionProfileForm, tono de juego por edad).
4. Pantalla L-D desplegable + palomitas + swap.
5. Plan de dúo (estructura compartida + dosis por miembro).
6. Copy pass por edad en TODA la app (council: voz MX + calibración).
