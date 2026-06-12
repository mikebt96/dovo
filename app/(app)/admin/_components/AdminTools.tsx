"use client";

import { useState, useTransition } from "react";
import {
  markErrorResolved,
  runSelfScan,
  type AppError,
  type ScanResult,
} from "@/lib/actions/admin";

// Herramientas client de la consola: self-scan on-demand, lista de errores con
// resolver, y "copiar reporte" (markdown listo para pegar a Claude y corregir).
export default function AdminTools({ errors }: { errors: AppError[] }) {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function doScan() {
    setScanErr(null);
    startTransition(async () => {
      const res = await runSelfScan();
      if (res.ok) setScan(res.data);
      else setScanErr(res.error);
    });
  }

  function copyReport() {
    const lines: string[] = ["## reporte dovo · consola admin", ""];
    if (scan) {
      lines.push(`### self-scan (${scan.ok ? "OK" : "CON HALLAZGOS"})`);
      for (const f of scan.findings) lines.push(`- [${f.status}] ${f.check}: ${f.detail}`);
      lines.push("");
    }
    const unresolved = errors.filter((e) => !e.resolved);
    if (unresolved.length) {
      lines.push(`### errores sin resolver (${unresolved.length})`);
      for (const e of unresolved.slice(0, 15)) {
        lines.push(`- **${e.origen}** · ${e.created_at}`);
        lines.push(`  ${e.mensaje}`);
        if (e.url) lines.push(`  url: ${e.url}`);
        if (e.stack) lines.push("  ```\n  " + e.stack.split("\n").slice(0, 6).join("\n  ") + "\n  ```");
      }
    } else {
      lines.push("### sin errores pendientes ✓");
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function resolve(id: string) {
    startTransition(async () => void (await markErrorResolved(id)));
  }

  const statusDot = (s: string) =>
    s === "critical" ? "bg-rival" : s === "warn" ? "bg-amber-400" : "bg-stat-vit";

  return (
    <div className="space-y-10">
      {/* Self-scan */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70">
            auto-diagnóstico
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={doScan}
              disabled={pending}
              className="rounded-full bg-ink text-papel px-4 py-2 text-[10px] mono uppercase tracking-[0.14em] hover:bg-signal hover:text-white transition-colors disabled:opacity-60"
            >
              {pending ? "escaneando…" : "▶ analizar sistema"}
            </button>
            <button
              type="button"
              onClick={copyReport}
              className="rounded-full border border-signal/40 text-signal px-4 py-2 text-[10px] mono uppercase tracking-[0.14em] hover:bg-signal/10 transition-colors"
            >
              {copied ? "✓ copiado" : "⧉ copiar reporte"}
            </button>
          </div>
        </div>
        {scanErr && (
          <p className="text-xs mono uppercase tracking-wider text-rival-deep">{scanErr}</p>
        )}
        {scan && (
          <div className="rounded-2xl border border-ink/10 divide-y divide-ink/8">
            {scan.findings.length === 0 ? (
              <p className="p-4 text-sm opacity-60">sistema limpio — sin hallazgos.</p>
            ) : (
              scan.findings.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${statusDot(f.status)}`} />
                  <div className="min-w-0">
                    <span className="text-[10px] mono uppercase tracking-widest opacity-50">
                      {f.check}
                    </span>
                    <p className="text-sm mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Errores */}
      <section>
        <h2 className="text-[11px] mono uppercase tracking-[0.18em] opacity-70 mb-4">
          errores capturados
        </h2>
        {errors.length === 0 ? (
          <p className="text-sm opacity-60">ninguno — todo en orden.</p>
        ) : (
          <ul className="space-y-2">
            {errors.map((e) => (
              <li
                key={e.id}
                className={`rounded-xl border p-4 ${
                  e.resolved ? "border-ink/8 opacity-50" : "border-ink/15"
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] mono uppercase tracking-widest text-signal">
                    {e.origen}
                  </span>
                  <span className="text-[10px] mono opacity-40">
                    {new Date(e.created_at).toLocaleString("es-MX", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {!e.resolved && (
                    <button
                      type="button"
                      onClick={() => resolve(e.id)}
                      className="ml-auto text-[10px] mono uppercase tracking-widest opacity-50 hover:opacity-100 hover:text-signal"
                    >
                      ✓ resuelto
                    </button>
                  )}
                </div>
                <p className="text-sm mt-2 break-words">{e.mensaje}</p>
                {e.url && <p className="text-[11px] mono opacity-40 mt-1 truncate">{e.url}</p>}
                {e.stack && (
                  <pre className="text-[10px] mono opacity-50 mt-2 overflow-x-auto max-h-24 leading-relaxed">
                    {e.stack.split("\n").slice(0, 5).join("\n")}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
