"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimReward, markRewardRedeemed } from "@/lib/actions/rewards";
import type { ProfileId } from "@/lib/types";

export type ClaimStatus =
  | "affordable"           // tienes coins → puedes reclamar
  | "unaffordable"         // te faltan coins
  | "claimed_unredeemed"   // ya reclamaste, pendiente de marcar usado
  | "claimed_redeemed"     // ya usado IRL — sólo mostrar histórico
  | "duo_blocked";         // requires_both pero al partner le faltan coins

export default function ClaimButton({
  rewardId,
  profile,
  status,
  claimId,
  costCoins,
  shortfall,
  accent,
}: {
  rewardId: number;
  profile: ProfileId;
  status: ClaimStatus;
  claimId?: number;
  costCoins: number;
  shortfall?: number;       // cuánto te falta si status='unaffordable' o 'duo_blocked'
  accent: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "unaffordable") {
    return (
      <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)]">
        faltan {shortfall}
      </span>
    );
  }

  if (status === "duo_blocked") {
    return (
      <span className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)]">
        partner faltan {shortfall}
      </span>
    );
  }

  if (status === "claimed_redeemed") {
    return (
      <span className="mono text-[10px] tracking-widest text-[color:var(--color-success)]">
        ✓ usado
      </span>
    );
  }

  function onClick() {
    setError(null);
    startTransition(async () => {
      if (status === "affordable") {
        const res = await claimReward({ reward_id: rewardId, profile });
        if (!res.ok) {
          setError(res.error);
          return;
        }
      } else if (status === "claimed_unredeemed" && claimId) {
        const res = await markRewardRedeemed({ claim_id: claimId, profile });
        if (!res.ok) {
          setError(res.error);
          return;
        }
      }
      router.refresh();
    });
  }

  const isClaiming = status === "affordable";
  const label = isClaiming
    ? pending
      ? "reclamando…"
      : `reclamar ${costCoins}`
    : pending
    ? "marcando…"
    : "marcar usado";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="mono text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 border transition disabled:opacity-50 hover:bg-[color:var(--color-surface-1)]"
        style={{
          borderColor: isClaiming ? accent : "var(--color-success)",
          color: isClaiming ? accent : "var(--color-success)",
        }}
      >
        {label}
      </button>
      {error && (
        <p className="mono text-[10px] text-[color:var(--color-danger)] max-w-[160px] text-right">
          {error}
        </p>
      )}
    </div>
  );
}
