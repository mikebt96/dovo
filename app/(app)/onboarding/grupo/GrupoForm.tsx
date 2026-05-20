"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearGrupo, unirseAGrupo } from "@/lib/actions/grupos";
import { TIPOS_GRUPO } from "@/lib/schemas/grupo";

export default function GrupoForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"crear" | "unirse">("crear");

  return (
    <div>
      <div className="flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setMode("crear")}
          className={`flex-1 py-3 syne lowercase ${
            mode === "crear" ? "bg-ink text-papel" : "border border-ink/30"
          }`}
        >
          crear grupo
        </button>
        <button
          type="button"
          onClick={() => setMode("unirse")}
          className={`flex-1 py-3 syne lowercase ${
            mode === "unirse" ? "bg-ink text-papel" : "border border-ink/30"
          }`}
        >
          unirme a uno
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
          nombre del grupo
        </span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Mike & Andy"
          className="w-full bg-papel border-b border-ink pb-2 focus:outline-none"
        />
      </label>

      <div>
        <span className="text-xs uppercase tracking-widest opacity-60 block mb-2">
          tamaño
        </span>
        <div className="space-y-2">
          {TIPOS_GRUPO.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              className={`w-full text-left p-4 border transition-colors ${
                tipo === t.value
                  ? "bg-ink text-papel border-ink"
                  : "border-ink/30 hover:border-ink"
              }`}
            >
              <span className="syne lowercase">{t.label}</span>
              <span className="text-xs opacity-70 ml-2">{t.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "creando…" : "crear y empezar"}
      </button>
    </div>
  );
}

function UnirseGrupo({ router }: { router: ReturnType<typeof useRouter> }) {
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
          pega el link o código de invitación
        </span>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="https://dovofit.com/invite/..."
          className="w-full bg-papel border-b border-ink pb-2 focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "uniéndote…" : "unirme"}
      </button>
    </div>
  );
}
