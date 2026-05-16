"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadPhoto } from "@/lib/actions/photos";
import type { ProfileId } from "@/lib/types";

const TODAY_ISO = () => new Date().toISOString().slice(0, 10);

export default function UploadForm({
  profile,
  accent,
}: {
  profile: ProfileId;
  accent: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [takenOn, setTakenOn] = useState(TODAY_ISO());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Foto > 4MB. Comprime antes de subir.");
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await uploadPhoto(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Reset y refrescar para mostrar la foto nueva en la lista
      form.reset();
      setPreview(null);
      setTakenOn(TODAY_ISO());
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="profile" value={profile} />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 items-start">
        <div className="space-y-3">
          <label className="block">
            <span className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] block mb-1">
              Fecha
            </span>
            <input
              type="date"
              name="taken_on"
              value={takenOn}
              max={TODAY_ISO()}
              onChange={(e) => setTakenOn(e.target.value)}
              className="input-bare input-mono"
            />
          </label>

          <label className="block">
            <span className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] block mb-1">
              Foto
            </span>
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={onFileChange}
              className="block w-full text-xs text-[color:var(--color-text-2)] file:mr-3 file:py-2 file:px-3 file:border file:border-[color:var(--color-divider-strong)] file:bg-transparent file:text-[color:var(--color-text)] file:mono file:tracking-widest file:uppercase file:text-[10px] file:cursor-pointer hover:file:border-[color:var(--color-text)] cursor-pointer"
            />
            <p className="mono text-[10px] text-[color:var(--color-text-4)] mt-2 leading-relaxed">
              jpg / png / webp · ≤ 4 MB · privada (solo tú y tu pareja con PIN)
            </p>
          </label>
        </div>

        <div className="border border-[color:var(--color-divider)] aspect-[3/4] flex items-center justify-center overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <p
              className="italic text-[color:var(--color-text-3)] text-center px-6"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Sube una foto para previsualizar
            </p>
          )}
        </div>
      </div>

      {error && (
        <p
          className="mono text-xs uppercase tracking-widest"
          style={{ color: "var(--color-danger)" }}
        >
          ✕ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !preview}
        className="btn-ink"
        style={{ background: accent, borderColor: accent }}
      >
        {pending ? "Subiendo + analizando…" : "Subir y analizar →"}
      </button>

      <p className="mono text-[10px] text-[color:var(--color-text-4)] leading-relaxed max-w-xl">
        Después del upload, Claude Vision analiza la foto en background.
        Refresca la página en ~10s para ver el resultado, o usa &ldquo;Reanalizar&rdquo;
        si el primer intento falla.
      </p>
    </form>
  );
}
