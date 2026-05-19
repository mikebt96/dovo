import Link from "next/link";
import { FRECUENCIAS } from "@/lib/schemas/trato";

export type TratoCardData = {
  id: string;
  goal: string;
  frecuencia: string;
  duracion_dias: number;
  partner_email: string;
  estado: "pendiente_aceptacion" | "activo" | "cerrado" | "disputado";
  isCreator: boolean;
};

const ESTADO_LABEL: Record<TratoCardData["estado"], string> = {
  pendiente_aceptacion: "esperando",
  activo: "activo",
  cerrado: "cerrado",
  disputado: "disputado",
};

export default function TratoCard({ trato }: { trato: TratoCardData }) {
  const frecuenciaLabel =
    FRECUENCIAS.find((f) => f.value === trato.frecuencia)?.label ?? trato.frecuencia;

  return (
    <Link
      href={`/trato/${trato.id}`}
      className="block border-b border-ink/20 py-6 hover:bg-papel-dark transition-colors"
    >
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h3 className="syne text-xl lowercase">{trato.goal}</h3>
        <span className="text-xs uppercase tracking-widest opacity-60 shrink-0">
          {ESTADO_LABEL[trato.estado]}
        </span>
      </div>
      <p className="text-xs opacity-60">
        {frecuenciaLabel} · {trato.duracion_dias} días ·{" "}
        {trato.isCreator ? `con ${trato.partner_email}` : "te invitaron"}
      </p>
    </Link>
  );
}
