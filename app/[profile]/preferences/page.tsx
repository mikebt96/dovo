import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getDietaryProfile } from "@/lib/profileServer";
import { getReplanHistory } from "@/lib/mealsServer";
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

  // Si la DB no responde (dev sin Supabase), arrancamos con defaults vacíos.
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

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Tu perfil
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Preferencias alimentarias
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Lo que comes, lo que evitas y tu CP para precios reales. Cuando
          guardes, la AI rediseña tus comidas para que las recomendaciones
          sean reales.
        </p>
      </header>

      <section className="card p-6">
        <PreferencesForm
          slug={profile.id}
          color={profile.color}
          initial={dietary}
        />
      </section>

      <ReplanHistory
        slug={profile.id}
        history={history}
        color={profile.color}
      />

      <p className="mono text-[10px] text-[var(--color-dim)]">
        Tus prefs viven en Supabase. El AI re-plan corre con Claude Haiku 4.5.
      </p>
    </div>
  );
}
