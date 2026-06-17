import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import CancelarCuentaButton from "@/app/(app)/ajustes/_components/CancelarCuentaButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "eliminar tu cuenta · dovo",
  description:
    "Cómo eliminar tu cuenta de dovo y tus datos personales. Disponible desde la app y desde esta página.",
};

// Página PÚBLICA de borrado de cuenta. Google Play exige una URL accesible SIN
// instalar la app donde el usuario pueda solicitar/realizar el borrado de su
// cuenta y datos (Account deletion policy). Se enlaza desde la ficha de Play.
// Lectura abierta; el borrado real exige sesión (o contacto si no puede entrar).
export default async function EliminarCuentaPage() {
  const t = await getTranslations("legal");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <article className="prose-dovo">
      <h1 className="display text-3xl font-extrabold lowercase mb-4">{t("delTitle")}</h1>
      <p className="text-sm leading-relaxed opacity-80 mb-8">{t("delIntro")}</p>

      <h2 className="display text-lg font-bold lowercase mb-3">{t("delQueSeBorra")}</h2>
      <ul className="space-y-2 pl-5 list-disc marker:opacity-50 text-sm mb-8">
        <li>{t("delItemPerfil")}</li>
        <li>{t("delItemNutri")}</li>
        <li>{t("delItemJuego")}</li>
        <li>{t("delItemLogin")}</li>
      </ul>

      <h2 className="display text-lg font-bold lowercase mb-3">{t("delQueSeConserva")}</h2>
      <ul className="space-y-2 pl-5 list-disc marker:opacity-50 text-sm mb-8">
        <li>{t("delConservaLegal")}</li>
        <li>{t("delConservaDisoc")}</li>
      </ul>

      <div className="rounded-2xl border border-ink/15 p-6 mb-6">
        {user ? (
          <>
            <p className="text-sm leading-relaxed mb-2">{t("delComoLogueado")}</p>
            <CancelarCuentaButton />
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed mb-4">{t("delComoNoLogueado")}</p>
            <Link
              href="/sign-in?next=/eliminar-cuenta"
              className="inline-block bg-ink text-papel px-5 py-2.5 rounded-full display font-semibold lowercase text-sm hover:bg-signal hover:text-white transition-colors"
            >
              {t("delIrLogin")}
            </Link>
          </>
        )}
      </div>

      <p className="text-sm leading-relaxed opacity-80 mb-6">{t("delSinAcceso")}</p>

      <Link
        href="/privacidad"
        className="text-sm underline decoration-signal/40 underline-offset-4 opacity-80 hover:opacity-100"
      >
        {t("delVerAviso")}
      </Link>
    </article>
  );
}
