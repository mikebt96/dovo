"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { unirseAGrupo } from "@/lib/actions/grupos";

export default function JoinButton({ token }: { token: string }) {
  const t = useTranslations("invite");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function join() {
    setError(null);
    start(async () => {
      const res = await unirseAGrupo({ token });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/");
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={join}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 rounded-full display font-semibold lowercase disabled:opacity-50 hover:bg-signal hover:text-white transition-colors"
      >
        {pending ? t("joining") : t("joinGroup")}
      </button>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}
