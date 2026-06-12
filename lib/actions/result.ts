// Resultado canónico de las server actions (consolidación F23·G4): la misma
// forma { ok, data } | { ok, error } que cada action declaraba localmente.
// SIN "use server": es un type module, importable desde client y server.
export type Result<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
