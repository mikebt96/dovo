"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { generateMyReview } from "@/lib/actions/weekly-review";
import type { ProfileId } from "@/lib/types";

export default function GenerateButton({
  profile,
  weekStart,
}: {
  profile: ProfileId;
  weekStart?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await generateMyReview({ profile, week_start: weekStart });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
        className="btn-ink"
      >
        {pending ? "Generando…" : "Generar review →"}
      </button>
      {error && (
        <p
          className="mono text-[10px] tracking-widest uppercase"
          style={{ color: "var(--color-danger)" }}
        >
          ✕ {error}
        </p>
      )}
    </div>
  );
}
