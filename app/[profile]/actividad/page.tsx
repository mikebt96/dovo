import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import ActivityLog from "@/app/components/ActivityLog";
import {
  Eyebrow,
  HRule,
  RoleDot,
} from "@/app/components/ui";

export default async function ActividadPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const accent =
    profile.id === "mike" ? "var(--color-role-mike)" : "var(--color-role-andy)";

  return (
    <div className="space-y-12 pb-20">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>fuera del gym</span>
        </Eyebrow>
        <h1
          className="font-extrabold lowercase tracking-tight leading-[0.85]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 9vw, 5.5rem)",
            color: "var(--color-text)",
            letterSpacing: "-0.04em",
          }}
        >
          actividad.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Ballet, pilates, running, natación. Todo lo que mueves fuera del gym
          también suma a tu racha y XP.
        </p>
      </section>

      <HRule />

      <ActivityLog
        storageKey={`activity-${profile.id}`}
        accent={accent}
        primarySport={profile.id === "andy" ? "ballet" : "running"}
      />
    </div>
  );
}
