import "server-only";
import { getServerSupabase } from "@/lib/supabase";

/**
 * Lecturas de pair_debts para la UI.
 * Devolvemos rows enriquecidas con slug de debtor/creditor + datos del
 * penalty asignado (si lo hay), para que la UI no haga joins extra.
 */

export type DebtRow = {
  id: number;
  debtor_slug: "mike" | "andy";
  creditor_slug: "mike" | "andy";
  status: "pending" | "paid" | "forgiven";
  reason: string | null;
  due_by: string | null;
  resolved_at: string | null;
  created_at: string;
  penalty: {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    severity: number;
  } | null;
};

type RawDebtRow = {
  id: number;
  status: string;
  reason: string | null;
  due_by: string | null;
  resolved_at: string | null;
  created_at: string;
  debtor: string;
  creditor: string;
  penalties_catalog: {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    severity: number;
  } | null;
};

type ProfileRow = { id: string; slug: string };

/**
 * Lista todas las deudas pending (más recientes primero).
 * No filtra por profile — la UI las muestra todas porque /duo es vista compartida.
 */
export async function listDebts(): Promise<DebtRow[]> {
  try {
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from("pair_debts")
      .select(
        `id, status, reason, due_by, resolved_at, created_at, debtor, creditor,
         penalties_catalog (id, name, description, category, severity)`,
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !data) return [];

    // Resolver slugs (solo 2 profiles, query única).
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, slug")
      .in("slug", ["mike", "andy"]);
    const slugById = new Map<string, "mike" | "andy">();
    for (const p of (profiles ?? []) as ProfileRow[]) {
      if (p.slug === "mike" || p.slug === "andy") {
        slugById.set(p.id, p.slug);
      }
    }

    return (data as unknown as RawDebtRow[]).map((d) => ({
      id: d.id,
      debtor_slug: slugById.get(d.debtor) ?? "mike",
      creditor_slug: slugById.get(d.creditor) ?? "andy",
      status: (["pending", "paid", "forgiven"].includes(d.status)
        ? d.status
        : "pending") as DebtRow["status"],
      reason: d.reason,
      due_by: d.due_by,
      resolved_at: d.resolved_at,
      created_at: d.created_at,
      penalty: d.penalties_catalog,
    }));
  } catch {
    return [];
  }
}

/** Catalog de penalties activas (para el dropdown "cambiar penalty"). */
export type PenaltyOption = {
  id: number;
  name: string;
  category: string | null;
  severity: number;
};

export async function listActivePenalties(): Promise<PenaltyOption[]> {
  try {
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from("penalties_catalog")
      .select("id, name, category, severity")
      .eq("active", true)
      .order("severity", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as PenaltyOption[];
  } catch {
    return [];
  }
}
