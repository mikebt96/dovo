import { createClient } from "@/lib/supabase/server";
import { getEstadoTrato } from "@/lib/actions/trato";
import TratoHUDClient from "./TratoHUDClient";

// El party status del juego cooperativo (directiva §4.5): SIEMPRE son dos.
// Server shell — fetchea la RPC estado_trato (la rutina del compa es owner-only
// por RLS) + la racha del trato, y deja el tickeo (countdown, nudge, respiración
// de los discos) al client island.
export default async function TratoHUD({ tratoId }: { tratoId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const estado = await getEstadoTrato(tratoId);
  if (!estado || estado.miembros.length === 0) return null;

  // yo primero — el jugador siempre se ve a sí mismo a la izquierda
  const miembros = [...estado.miembros]
    .sort((a, b) => (a.user_id === user.id ? -1 : b.user_id === user.id ? 1 : 0))
    .map((m) => ({
      userId: m.user_id,
      nombre: m.nombre,
      freq: m.freq_objetivo,
      semana: m.checkins_semana,
      hoy: m.checkin_hoy,
      hoySellado: m.checkin_hoy_sellado,
      esYo: m.user_id === user.id,
    }));

  return (
    <TratoHUDClient
      tratoId={tratoId}
      miembros={miembros}
      racha={
        estado.racha
          ? { current: estado.racha.current, max: estado.racha.max }
          : null
      }
    />
  );
}
