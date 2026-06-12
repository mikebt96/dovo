import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getApuestaSemana } from "@/lib/actions/apuestas";
import {
  sugerenciasApuesta,
  sugerenciasPremio,
  tierPorRacha,
} from "@/lib/trato/apuestas-catalogo";
import { hoyCDMX } from "@/lib/workout/fecha";
import GameIcon from "./GameIcon";
import ApuestaSheet from "./ApuestaSheet";
import ApuestaSaldarButton from "./ApuestaSaldarButton";

// LA APUESTA SEMANAL — el trasfondo de la app: el compromiso entre ambos para
// ser mejores y EN CONJUNTO ir ganando cosas. La carta vive en el lobby, bajo
// el TratoHUD: qué se juegan, quién va arriba HOY (marcador interno honesto,
// puntos normalizados) y el recordatorio amistoso de la apuesta por saldar.
export default async function ApuestaSemanal({ tratoId }: { tratoId: string }) {
  const t = await getTranslations("apuesta");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getApuestaSemana(tratoId);
  if (!data) return null;

  const hoy = hoyCDMX();
  const { actual: tier, siguiente } = tierPorRacha(data.rachaTrato);
  const yo = data.marcador.find((m) => m.esYo);
  const otro = data.marcador.find((m) => !m.esYo);
  const hayPuntos = (yo?.pts ?? 0) + (otro?.pts ?? 0) > 0;

  return (
    <section aria-label={t("eyebrow")} className="mb-8 anim-fade-up">
      {/* recordatorio amistoso: la apuesta de la semana pasada sin saldar */}
      {data.pendiente && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 px-4 py-2.5">
          <GameIcon name="premio" size={14} className="shrink-0 opacity-60" />
          <p className="flex-1 min-w-0 text-[11px] mono lowercase tracking-[0.04em] opacity-70">
            {data.pendiente.perdedor_interno === user.id
              ? t("debesTu", { apuesta: data.pendiente.apuesta_text })
              : t("debeOtro", {
                  nombre: data.pendiente.perdedor_nombre ?? "tu compa",
                  apuesta: data.pendiente.apuesta_text,
                })}
          </p>
          {data.pendiente.perdedor_interno !== user.id && (
            <ApuestaSaldarButton apuestaId={data.pendiente.id} />
          )}
        </div>
      )}

      {data.actual ? (
        /* ── apuesta VIVA: qué se juegan + marcador interno honesto ── */
        <div className="card-game relative overflow-hidden p-5 sm:p-6 text-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] mono uppercase tracking-[0.22em] text-white/50">
              {t("eyebrow")}
            </p>
            <span
              className="text-[9px] mono uppercase tracking-[0.18em] rounded-full px-2 py-0.5"
              style={{ color: "#ffb454", background: "color-mix(in srgb, #ffb454 14%, transparent)" }}
            >
              {t("viva")}
            </span>
          </div>

          <p
            className="mt-2.5 display font-extrabold lowercase leading-tight text-xl sm:text-2xl"
            style={{ color: "#f0c75a", textShadow: "0 0 28px rgba(240,199,90,0.35)" }}
          >
            <GameIcon name="premio" size={18} filled className="inline-block mr-2 -mt-1" />
            {data.actual.premio_text}
          </p>
          <p className="mt-1.5 text-[11px] mono lowercase tracking-[0.04em] text-white/60">
            {t("apuestaLinea", { apuesta: data.actual.apuesta_text })}
          </p>

          {/* marcador interno vivo — datos reales, jamás inventados */}
          {yo && otro && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <p className="text-[11px] mono uppercase tracking-[0.14em] tabular-nums text-white/75">
                {t("van")}{" "}
                <span style={{ color: "var(--c-signal)" }}>
                  {t("tu")} {yo.pts.toLocaleString("es-MX")}
                </span>
                {" · "}
                <span className="lowercase">
                  {otro.nombre} {otro.pts.toLocaleString("es-MX")}
                </span>
              </p>
              {hayPuntos && (
                <span className="shrink-0 text-[10px] mono uppercase tracking-[0.14em] text-white/45">
                  {yo.pts === otro.pts
                    ? t("parejos")
                    : yo.pts > otro.pts
                      ? t("arriba")
                      : t("abajo")}
                </span>
              )}
            </div>
          )}

          <div className="mt-4">
            {/* key: si el compa re-sella, el sheet re-monta con el texto nuevo
                (useState(inicial) solo siembra en mount) — F23·G18 */}
            <ApuestaSheet
              key={`${data.actual.id}|${data.actual.premio_text}|${data.actual.apuesta_text}`}
              tratoId={tratoId}
              tierNombre={tier.nombre}
              racha={data.rachaTrato}
              sugerenciasPremio={sugerenciasPremio(data.rachaTrato, hoy)}
              sugerenciasApuesta={sugerenciasApuesta(hoy)}
              siguienteTier={
                siguiente ? { nombre: siguiente.nombre, minRacha: siguiente.minRacha } : null
              }
              inicial={{
                premio: data.actual.premio_text,
                apuesta: data.actual.apuesta_text,
              }}
            />
          </div>
        </div>
      ) : (
        /* ── sin apuesta: el CTA del corazón del juego ── */
        <div className="card-game relative overflow-hidden p-5 sm:p-6 text-white">
          <p className="text-[10px] mono uppercase tracking-[0.22em] text-white/50">
            {t("eyebrow")}
          </p>
          <p className="mt-2 display font-extrabold lowercase leading-tight text-xl sm:text-2xl">
            {t("ctaTitle")}
          </p>
          <p className="mt-1.5 text-xs text-white/55 leading-relaxed">{t("ctaSub")}</p>
          <div className="mt-4">
            <ApuestaSheet
              tratoId={tratoId}
              tierNombre={tier.nombre}
              racha={data.rachaTrato}
              sugerenciasPremio={sugerenciasPremio(data.rachaTrato, hoy)}
              sugerenciasApuesta={sugerenciasApuesta(hoy)}
              siguienteTier={
                siguiente ? { nombre: siguiente.nombre, minRacha: siguiente.minRacha } : null
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}
