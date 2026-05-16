"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeDebtPenalty,
  markDebtForgiven,
  markDebtPaid,
} from "@/lib/actions/debts";
import type { DebtRow } from "@/lib/queries/debts";
import type { PenaltyOption } from "@/lib/queries/debts";

/**
 * Una fila de deuda con acciones. La penalty se puede cambiar desde un
 * <select> antes (o después) de marcarla como paid/forgiven.
 */
export default function DebtRowItem({
  debt,
  penalties,
}: {
  debt: DebtRow;
  penalties: PenaltyOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [editingPenalty, setEditingPenalty] = useState(false);
  const router = useRouter();

  const debtorColor =
    debt.debtor_slug === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";

  const isResolved = debt.status !== "pending";

  function handle(action: () => Promise<{ ok: boolean }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <li
      className={`border px-5 py-4 ${
        isResolved
          ? "border-[color:var(--color-divider)] opacity-60"
          : "border-[color:var(--color-divider-strong)]"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <p className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)]">
            <span style={{ color: debtorColor }}>{debt.debtor_slug}</span>
            {" "}le debe a{" "}
            <span
              style={{
                color: debt.creditor_slug === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)",
              }}
            >
              {debt.creditor_slug}
            </span>
          </p>
          <p
            className="font-extrabold tracking-tight mt-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}
          >
            {debt.penalty?.name ?? "(sin penalty asignada)"}
          </p>
          {debt.penalty?.description && (
            <p className="text-sm text-[color:var(--color-text-3)] mt-1 leading-relaxed">
              {debt.penalty.description}
            </p>
          )}
        </div>
        <span
          className="mono text-[10px] tabular tracking-widest uppercase px-2 py-1 border"
          style={{
            color:
              debt.status === "paid"
                ? "var(--color-success)"
                : debt.status === "forgiven"
                  ? "var(--color-text-3)"
                  : "var(--color-warning)",
            borderColor: "currentColor",
          }}
        >
          {debt.status === "paid" ? "pagada" : debt.status === "forgiven" ? "perdonada" : "pendiente"}
        </span>
      </div>

      {debt.reason && (
        <p
          className="mt-3 italic text-[color:var(--color-text-2)] leading-relaxed"
          style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem" }}
        >
          {debt.reason}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)]">
          {debt.due_by ? `desde ${debt.due_by}` : "sin fecha"}
        </p>
        {debt.penalty && (
          <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)]">
            severidad {debt.penalty.severity}
          </p>
        )}
      </div>

      {!isResolved && (
        <div className="mt-4 pt-4 border-t border-[color:var(--color-divider)] space-y-3">
          {editingPenalty ? (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                disabled={pending}
                defaultValue={debt.penalty?.id ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const penalty_id = v === "" ? null : parseInt(v, 10);
                  handle(() => changeDebtPenalty({ id: debt.id, penalty_id }));
                }}
                className="input-bare input-mono max-w-xs"
              >
                <option value="">(sin penalty)</option>
                {penalties.map((p) => (
                  <option key={p.id} value={p.id}>
                    sev{p.severity} · {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setEditingPenalty(false)}
                className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-4)] hover:text-[color:var(--color-text)] transition"
              >
                cerrar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                disabled={pending}
                onClick={() => handle(() => markDebtPaid({ id: debt.id }))}
                className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-success)] hover:underline disabled:opacity-50"
              >
                marcar pagada
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => handle(() => markDebtForgiven({ id: debt.id }))}
                className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-3)] hover:text-[color:var(--color-text)] transition disabled:opacity-50"
              >
                perdonar
              </button>
              <button
                type="button"
                onClick={() => setEditingPenalty(true)}
                className="mono text-[10px] tracking-widest uppercase text-[color:var(--color-text-4)] hover:text-[color:var(--color-text)] transition"
              >
                cambiar penalty
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
