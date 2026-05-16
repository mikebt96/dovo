import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getDietaryProfile, getNotificationSettings } from "@/lib/profileServer";
import { getReplanHistory } from "@/lib/mealsServer";
import {
  Eyebrow,
  HRule,
  RoleDot,
  SectionLabel,
} from "@/app/components/ui";
import PreferencesForm from "./PreferencesForm";
import ReplanHistory from "./ReplanHistory";

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const accent =
    profile.id === "mike"
      ? "var(--color-role-mike)"
      : "var(--color-role-andy)";

  const dietary = (await getDietaryProfile(profile.id).catch(() => null)) ?? {
    postalCode: undefined,
    dietaryTags: [],
    allergens: [],
    dislikedIngredients: [],
    likedIngredients: [],
    dislikedTextures: [],
    maxMealKcal: undefined,
    notesForAi: undefined,
  };

  const history = await getReplanHistory(profile.id, 10).catch(() => []);
  const notifications = (await getNotificationSettings(profile.id).catch(
    () => null
  )) ?? { phoneE164: undefined, whatsappOptIn: false };

  return (
    <div className="space-y-12 pb-20 max-w-3xl">
      <section className="pt-4">
        <Eyebrow className="mb-3">
          <RoleDot who={profile.id} />
          <span>{profile.displayName.toLowerCase()}</span>
          <span className="text-[color:var(--color-text-4)]">·</span>
          <span>tu ficha alimentaria</span>
        </Eyebrow>
        <h1
          className="font-extrabold lowercase tracking-tight leading-[0.85]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3rem, 9vw, 5rem)",
            color: "var(--color-text)",
            letterSpacing: "-0.04em",
          }}
        >
          ajustes.
        </h1>
        <p
          className="mt-4 text-[color:var(--color-text-2)] leading-relaxed max-w-xl"
          style={{ fontSize: "1.05rem" }}
        >
          Cuando guardes cambios, la AI rediseña tus comidas para que se
          ajusten a ti. El plan deja de ser genérico y empieza a parecerse
          a cómo realmente comes.
        </p>
      </section>

      <HRule />

      <SectionLabel>Declaración alimentaria</SectionLabel>
      <div className="mt-2">
        <PreferencesForm
          slug={profile.id}
          color={accent}
          initial={dietary}
          notifications={notifications}
        />
      </div>

      <HRule />

      <ReplanHistory slug={profile.id} history={history} color={accent} />

      <p className="mono text-[10px] tracking-widest text-[color:var(--color-text-4)] mt-8">
        datos guardados en supabase · AI re-plan con claude haiku 4.5
      </p>
    </div>
  );
}
