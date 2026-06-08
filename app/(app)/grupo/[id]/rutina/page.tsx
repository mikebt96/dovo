import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import PageHero from "@/app/_components/PageHero";
import RutinaForm from "./RutinaForm";

export const dynamic = "force-dynamic";

type Actividad = {
  id: string;
  slug: string;
  nombre: string;
  metricas_requeridas: string[];
};

export default async function RutinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("rutina");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: miembro } = await supabase
    .schema("core")
    .from("trato_miembros")
    .select("id")
    .eq("trato_id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  if (!miembro) redirect("/");

  const { data: actividades } = await supabase
    .schema("core")
    .from("actividades")
    .select("id, slug, nombre, metricas_requeridas")
    .eq("activa", true)
    .order("nombre");

  const { data: rutina } = await supabase
    .schema("core")
    .from("user_rutinas")
    .select("nombre, actividades")
    .eq("miembro_id", miembro.id)
    .eq("is_default", true)
    .maybeSingle<{ nombre: string; actividades: unknown }>();

  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-10 bg-papel text-ink">
      <AppNav />
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <RutinaForm
        grupoId={id}
        miembroId={miembro.id}
        actividades={(actividades ?? []) as Actividad[]}
        inicial={rutina ?? null}
      />
    </main>
  );
}
