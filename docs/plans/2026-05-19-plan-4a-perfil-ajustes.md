# Plan 4a · Perfil + Ajustes

**Fecha**: 2026-05-19 (autonomous mode)
**Spec source**: Pantallas 07 y 08 del MVP spec (3.3) + decisiones 11.1
**Predecesor**: Plan 3 (check-ins + streak) shipped @ tag `v0.3-checkins`

---

## Contexto

Después de Plan 3, los users pueden crear tratos, hacer check-ins y ver resultados. Los `user_scores` se actualizan automáticamente vía trigger al cerrar trato — pero **no hay UI** para verlos.

También falta el opt-out de Pulse DOVO, que es **P0** según el spec (sección 8 build sequence semana 7).

Plan 4a entrega dos rutas nuevas:
- `/perfil` (Pantalla 07 · P1) — score + visibility toggle + history de tratos cerrados
- `/ajustes` (Pantalla 08 · P0) — opt-out de Pulse + sign out + datos básicos

---

## Decisiones

### D1 · Dos rutas separadas

Spec distingue Pantalla 07 (perfil) de Pantalla 08 (ajustes). Mantengo la separación:
- **Perfil**: lectura. Lo que el user logró. Page sin mucha interactividad.
- **Ajustes**: panel de control. Toggles, danger zone (sign out), config.

Combinarlas en una sola page mezcla "vanity metrics" con "system config". Spec las separa por una razón.

### D2 · Score visibility default hidden

Decisión spec 11.1 ya está reflejada en migration `core.user_scores.visibility` default `'hidden'`. Plan 4a solo expone el toggle a 3 estados.

### D3 · Pulse opt-out tiene efecto a futuro

Cuando user activa opt-out:
- `core.users.pulse_opt_out = true`
- Eventos futuros de este user NO se envían a `pulse.eventos_agregados`
- Eventos previos quedan donde están (no retroactivo; spec 5.4 implica esto)

Como Plan 4a no incluye la edge function `ingest-pulse-event` aún (queda para Plan 4b), el toggle por ahora solo persiste la preferencia. Cuando Plan 4b shippee, esa edge function consultará `pulse_opt_out` antes de enviar el evento.

### D4 · Score history limita a 20 tratos

`/perfil` muestra los últimos 20 tratos cerrados del user con su resultado. Para Año 1 esto sobra. Paginación queda para v0.2 si alguien acumula >20.

---

## Tareas

### T1 · `lib/actions/profile.ts`

Server actions:
- `updateScoreVisibility(visibility: 'hidden' | 'duos_con_trato' | 'publico')` — UPDATE `core.user_scores.visibility`. Si el row no existe (usuario sin tratos cerrados), insert con `tratos_cerrados=0, tratos_cumplidos=0, visibility=...`.
- `updatePulseOptOut(opt_out: boolean)` — UPDATE `core.users.pulse_opt_out`.
- `signOut()` — `supabase.auth.signOut()` + redirect a `/`.

### T2 · `lib/schemas/profile.ts`

Zod inputs para validation server-side de las dos primeras actions.

### T3 · Page `app/(app)/perfil/page.tsx`

Server component:
- Carga `core.user_scores` del user actual (si no existe, default zero state)
- Carga últimos 20 `core.tratos` donde user es creator o partner Y estado='cerrado', ordenados por closed_at desc
- Renderiza: score grande, visibility toggle, lista de tratos con su resultado y "tú cumpliste/fallaste" por user

### T4 · Page `app/(app)/ajustes/page.tsx`

Server component:
- Email + nombre del user
- Toggle pulse_opt_out
- Botón sign out (form que llama signOut action)
- Link "feedback / soporte" como mailto a Miguel

### T5 · Components

- `app/(app)/perfil/_components/VisibilityToggle.tsx` (client, 3 botones)
- `app/(app)/ajustes/_components/PulseOptOutToggle.tsx` (client, switch)
- `app/(app)/ajustes/_components/SignOutButton.tsx` (client, form)

### T6 · Nav links en home

En `app/_components/home-authed.tsx` agregar links discretos a `/perfil` y `/ajustes` en el header (o footer).

### T7 · Smoke + tag v0.4a

1. Verify `/perfil` muestra score 0 para users sin tratos cerrados
2. Cerrar un trato vía MCP → refresh `/perfil` → muestra score actualizado
3. Toggle visibility → verify update en BD
4. Toggle pulse_opt_out → verify update en BD
5. Sign out funciona
6. Tag `v0.4a-perfil-ajustes`, push

---

## Out of scope (futuras Plan 4b/4c/...)

- Edge function `ingest-pulse-event` (Plan 4b)
- Tratos Patrocinados (Plan 4c)
- Email transactional (Plan 4d, requiere Resend setup)
- Push notifications (Plan 4e, iOS PWA push)
- Score como signal externo (Año 2+)
