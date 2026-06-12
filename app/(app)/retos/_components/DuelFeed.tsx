import { getTranslations } from "next-intl/server";
import type { AtaqueRow, MiembroReto } from "@/lib/actions/ataques";
import GameIcon, { type GameIconName } from "@/app/_components/GameIcon";

// F10 · Historial del duelo: cada ataque cuenta una historia corta ("Iván golpeó a
// Cinco Disciplinas −10"). Server component (sin interactividad); la página es
// force-dynamic así que el "hace Xh" se calcula fresco en cada request.

function hace(t: (k: string, v: Record<string, number>) => string, iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return t("atkAgoM", { n: 1 }); // fecha malformada ⇒ jamás "NaN min"
  const mins = Math.max(1, Math.floor(ms / 60_000));
  if (mins < 60) return t("atkAgoM", { n: mins });
  const horas = Math.floor(mins / 60);
  if (horas < 24) return t("atkAgoH", { n: horas });
  return t("atkAgoD", { n: Math.max(1, Math.floor(horas / 24)) });
}

export default async function DuelFeed({
  ataques,
  miembros,
  nombresDuo,
  congelados,
}: {
  ataques: AtaqueRow[];
  miembros: MiembroReto[];
  nombresDuo: Record<string, string>; // trato_id → nombre_grupo
  congelados: { user_id: string; hasta: string }[];
}) {
  const t = await getTranslations("retos");

  const nombreDe = (userId: string | null): string =>
    (userId && miembros.find((m) => m.user_id === userId)?.nombre) || "?";

  // Empty-state que refuerza el Hook (mejor que el silencio — y evita la columna
  // lg vacía del review): el feed siempre renderiza algo en un duelo activo.
  if (ataques.length === 0 && congelados.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-ink/15 p-5">
        <h3 className="text-[11px] mono uppercase tracking-[0.22em] opacity-50 mb-2">
          {t("atkFeedTitle")}
        </h3>
        <p className="text-sm opacity-60">{t("atkFeedEmpty")}</p>
      </section>
    );
  }

  const visibles = ataques.slice(0, 12);

  return (
    <section className="rounded-2xl border border-ink/12 p-5 lg:max-h-[30rem] lg:overflow-y-auto">
      <h3 className="text-[11px] mono uppercase tracking-[0.22em] opacity-50 mb-4">
        {t("atkFeedTitle")}
      </h3>

      {congelados.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {congelados.map((c) => (
            <span
              key={c.user_id + c.hasta}
              className="anim-frost inline-flex items-center gap-1.5 rounded-full border border-stat-vel/40 bg-stat-vel/10 px-3 py-1.5 text-[11px] mono uppercase tracking-wider text-freeze-deep"
            >
              <GameIcon name="hielo" size={13} />
              {nombreDe(c.user_id)} · {t("atkFrozenChip")}
            </span>
          ))}
        </div>
      )}

      <ul className="space-y-3">
        {visibles.map((a, i) => {
          const de = nombreDe(a.de_user);
          const duoVictima = nombresDuo[a.para_trato] ?? "?";
          const texto =
            a.resultado === "bloqueado"
              ? t("atkFeedBlocked", { duo: duoVictima, de })
              : a.tipo === "golpe"
                ? t("atkFeedGolpeHit", { de, duo: duoVictima })
                : t("atkFeedFreezeHit", { de, para: nombreDe(a.para_user) });
          const icono: GameIconName =
            a.resultado === "bloqueado" ? "escudo" : a.tipo === "golpe" ? "golpe" : "hielo";
          return (
            <li
              key={a.id}
              className="anim-fade-up flex items-start gap-3"
              style={{ "--anim-delay": `${Math.min(i, 8) * 60}ms` } as React.CSSProperties}
            >
              <GameIcon
                name={icono}
                size={18}
                filled={icono !== "hielo"}
                className="shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{texto}</p>
                <p className="text-[10px] mono uppercase tracking-wider opacity-40 mt-0.5">
                  {hace(t as unknown as (k: string, v: Record<string, number>) => string, a.created_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      {ataques.length > visibles.length && (
        <p className="text-[10px] mono uppercase tracking-wider opacity-40 mt-3">
          +{ataques.length - visibles.length}
        </p>
      )}
    </section>
  );
}
