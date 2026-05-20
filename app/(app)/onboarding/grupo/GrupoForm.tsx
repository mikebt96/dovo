"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { crearGrupo, unirseAGrupo } from "@/lib/actions/grupos";
import { TIPOS_GRUPO } from "@/lib/schemas/grupo";

export default function GrupoForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [mode, setMode] = useState<"crear" | "unirse">("crear");

  return (
    <div>
      <div className="flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setMode("crear")}
          className={`flex-1 py-3 rounded-full display font-semibold lowercase transition-colors ${
            mode === "crear" ? "bg-ink text-papel" : "border border-ink/25 hover:border-signal"
          }`}
        >
          {t("createGroupTab")}
        </button>
        <button
          type="button"
          onClick={() => setMode("unirse")}
          className={`flex-1 py-3 rounded-full display font-semibold lowercase transition-colors ${
            mode === "unirse" ? "bg-ink text-papel" : "border border-ink/25 hover:border-signal"
          }`}
        >
          {t("joinGroupTab")}
        </button>
      </div>

      {mode === "crear" ? (
        <CrearGrupo router={router} />
      ) : (
        <UnirseGrupo router={router} />
      )}
    </div>
  );
}

function CrearGrupo({ router }: { router: ReturnType<typeof useRouter> }) {
  const t = useTranslations("onboarding");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS_GRUPO)[number]["value"]>(
    "pareja",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await crearGrupo({ nombre_grupo: nombre, tipo_grupo: tipo });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/");
    });
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60 block mb-2">
          {t("groupName")}
        </span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={t("groupNamePlaceholder")}
          className="w-full bg-transparent border-b border-ink/40 pb-2 focus:outline-none focus:border-signal"
        />
      </label>

      <div>
        <span className="text-xs uppercase tracking-widest opacity-60 block mb-2">
          {t("size")}
        </span>
        <div className="space-y-2">
          {TIPOS_GRUPO.map((tg) => (
            <button
              key={tg.value}
              type="button"
              onClick={() => setTipo(tg.value)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                tipo === tg.value
                  ? "border-signal bg-signal/10"
                  : "border-ink/20 hover:border-signal"
              }`}
            >
              <span className="display font-medium lowercase">{t(`tipo.${tg.value}`)}</span>
              <span className="text-xs opacity-70 ml-2">{t(`tipoHint.${tg.value}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 rounded-full display font-semibold lowercase disabled:opacity-50 hover:bg-signal hover:text-white transition-colors"
      >
        {pending ? t("creating") : t("createStart")}
      </button>
    </div>
  );
}

function UnirseGrupo({ router }: { router: ReturnType<typeof useRouter> }) {
  const t = useTranslations("onboarding");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      // El user puede pegar el link completo o solo el token
      const clean = token.trim().split("/").pop() ?? token.trim();
      const res = await unirseAGrupo({ token: clean });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/");
    });
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60 block mb-2">
          {t("inviteLabel")}
        </span>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={t("invitePlaceholder")}
          className="w-full bg-transparent border-b border-ink/40 pb-2 focus:outline-none focus:border-signal"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 rounded-full display font-semibold lowercase disabled:opacity-50 hover:bg-signal hover:text-white transition-colors"
      >
        {pending ? t("joining") : t("join")}
      </button>
    </div>
  );
}
