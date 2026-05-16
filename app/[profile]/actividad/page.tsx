import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import ActivityLog from "@/app/components/ActivityLog";

export default async function ActividadPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Actividad no-gym
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Ballet · Pilates · Otros
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-xl">
          Loguea las sesiones de actividades que no entran en el gym (ballet,
          pilates, running, natación...). Suma a tu progreso semanal y XP.
        </p>
      </header>

      <ActivityLog
        storageKey={`activity-${profile.id}`}
        accent={profile.color}
        primarySport={profile.id === "andy" ? "ballet" : "running"}
      />
    </div>
  );
}
