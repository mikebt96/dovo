# F10 · Ataques entre dúos rivales + dinámica + responsive desktop

*Build brief · 2026-06-10 · pedido directo de Miguel ("lanzar ataques a contrincantes,
más dinámica, más animaciones, responsive de verdad")*

## Qué es

La pata ofensiva del spec §3.16 ("golpes/congelamientos entre dúos rivales, nunca contra
el propio partner"): durante un **duelo activo** puedes lanzar ataques al dúo rival.
Diseñado con el Hook (skill `hooked-ux`):

- **Trigger**: push "¡{grupo} les lanzó un golpe!" (F8) + tensión competitiva del duelo.
- **Action**: 1 tap desde el marcador del duelo. **La munición se gana ENTRENANDO**:
  tu ataque del día se desbloquea solo si hiciste check-in hoy → el ataque es recompensa
  del comportamiento core, no un juguete gratis.
- **Variable reward**: no sabes si el rival tiene **escudo** (boost existente) hasta que
  golpeas — si lo tiene, tu ataque rebota y consume su escudo (slot machine limpio).
- **Investment**: los escudos intra-dúo suben de valor; historial del duelo (feed).

## Mecánica (acotada — el motor de puntos NO se toca)

| Ataque | Efecto (solo el MARCADOR del duelo) | Si hay escudo rival |
|---|---|---|
| 🥊 **golpe** | −10 pts al marcador rival (piso 0) | Bloqueado, escudo se consume |
| ❄️ **congelamiento** | check-ins del MIEMBRO objetivo no suman al marcador por 12h | Bloqueado, escudo se consume |

Stats personales, leaderboard global y rachas: **intactos**. Solo el marcador del reto.

**Anti-toxicidad**: solo dentro de duelos aceptados por ambos dúos · 1 ataque/miembro/día ·
regla de oro en RPC (jamás a tu propio dúo) · tono juguetón ("mañana hay revancha") ·
el congelado lo ve con humor (escarcha en su chip, countdown).

## Arquitectura

- `core.ataques` (reto_id, de_user/de_trato, para_trato, para_user?, tipo, resultado
  impacto|bloqueado, puntos, congela_hasta). RLS: SELECT para las partes del reto
  (is_reto_party); INSERT **solo vía RPC**.
- **RPC `core.lanzar_ataque`** (SECURITY DEFINER, atómico): valida reto activo + pertenencia
  + munición (check-in HOY, CDMX; dúos demo exentos) + límite diario + resuelve escudo
  con lock (`for update`) + inserta. Toda la lógica de negocio en un solo lugar, sin carreras.
- **`core.puntos_reto(reto, trato)`**: función compartida que aplica golpes y congelamientos.
  `marcador_reto` y `cerrar_reto` la usan AMBOS (el ganador se decide con la misma
  matemática que muestra el marcador).
- Push al dúo rival vía pref `reto` existente.

## UI/Animaciones (CSS-first, prefers-reduced-motion siempre)

- **AttackPanel** bajo el marcador: munición ("entrena hoy para desbloquear tu ataque" si
  no hay check-in), golpe 1-tap, congelar con picker de miembro rival.
- Resultado animado: 💥 shake del marcador rival + −10 flotante · 🛡️ flash de bloqueo ·
  ❄️ overlay de escarcha en el chip congelado.
- **DuelFeed**: historial del duelo (ataques, bloqueos) con entrada staggered.
- Keyframes globales en globals.css (shake, frost, pop, fade-up, float).

## Responsive desktop (el reclamo de Miguel)

Páginas en columna `max-w-2xl` suben a layouts reales de desktop: retos (marcador+panel ·
feed lado a lado, lg:max-w-5xl), perfil (2-col), ajustes (2-col), grupo (ancho), recompensas
(verificar grid). Home/leaderboard/nutricion/rutina ya tenían breakpoint.

## Demo

El reto activo Híbridos vs Cinco Disciplinas se siembra con 2 ataques de historia
(un golpe recibido bloqueado por escudo + un golpe propio con impacto) y Iván tiene
check-in de hoy ⇒ munición lista para lanzar en vivo frente al inversionista.
