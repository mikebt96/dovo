import "server-only";

// Identidad de admin vía env (sin tabla de roles para 1 admin): lista de emails
// separados por coma. Default: Miguel. Server-side only — jamás llega al cliente.
const DEFAULT_ADMINS = "miguel.butron06@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? DEFAULT_ADMINS)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
