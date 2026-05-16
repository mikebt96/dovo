"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePhoto, reanalyzePhoto } from "@/lib/actions/photos";
import type { ProfileId } from "@/lib/types";

export default function PhotoActions({
  profile,
  photo_id,
  hasAnalysis,
}: {
  profile: ProfileId;
  photo_id: number;
  hasAnalysis: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-3 mt-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await reanalyzePhoto(photo_id);
            router.refresh();
          })
        }
        className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] hover:text-[color:var(--color-accent)] transition disabled:opacity-50"
      >
        {pending ? "…" : hasAnalysis ? "reanalizar" : "analizar ahora"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (!confirm("¿Borrar esta foto y su análisis?")) return;
            await deletePhoto({ profile, photo_id });
            router.refresh();
          })
        }
        className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-4)] hover:text-[color:var(--color-danger)] transition disabled:opacity-50"
      >
        eliminar
      </button>
    </div>
  );
}
