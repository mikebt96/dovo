"use client";

/**
 * Error boundary global del App Router.
 * Reemplaza el "Application error: server-side exception" genérico de
 * production con algo que el user pueda accionar.
 *
 * En production los detalles del error NO se exponen (puede contener
 * secrets en el message). Solo el digest, que el user puede pegar al
 * dev para correlacionar con los logs de Vercel.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <main className="max-w-lg w-full">
        <p
          className="mono text-[10px] tracking-[0.22em] uppercase mb-3"
          style={{ color: "var(--color-danger)" }}
        >
          algo se rompió
        </p>
        <h1
          className="font-extrabold lowercase tracking-tight leading-[0.85]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 7vw, 4rem)",
            letterSpacing: "-0.04em",
          }}
        >
          error de servidor.
        </h1>
        <p
          className="mt-5 text-[color:var(--color-text-2)] leading-relaxed"
          style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem" }}
        >
          Probablemente faltan env vars de configuración. Si esto persiste,
          revisa Vercel → Settings → Environment Variables y compara contra
          el README.
        </p>

        {error.digest && (
          <p className="mono text-[10px] tracking-widest mt-4 text-[color:var(--color-text-3)]">
            digest: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className="btn-ink">
            Reintentar
          </button>
          <a href="/unlock" className="btn-ghost">
            Ir a /unlock
          </a>
        </div>
      </main>
    </div>
  );
}
