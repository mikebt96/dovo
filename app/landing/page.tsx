import Landing from "@/app/_components/landing";

// Landing accesible SIEMPRE (aunque estés logueado), para mostrarla a inversionistas
// sin cerrar sesión. `/` sigue mostrando la app si hay sesión; aquí siempre la landing.
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return <Landing />;
}
