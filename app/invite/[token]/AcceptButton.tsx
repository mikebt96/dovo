"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptTrato } from "@/lib/actions/tratos";

export default function AcceptButton({
  token,
  tratoId,
}: {
  token: string;
  tratoId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptTrato(token);
      if (result.ok) {
        router.push(`/trato/${tratoId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onAccept}
        disabled={pending}
        className="block w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "aceptando..." : "aceptar el trato"}
      </button>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs opacity-50 text-center">
        si aceptas, ambos quedan comprometidos hasta cerrar el trato.
      </p>
    </div>
  );
}
