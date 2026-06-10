import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Grain from "@/app/_components/Grain";
import BottomHUDServer from "@/app/_components/BottomHUDServer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return (
    <>
      {children}
      {/* La nav ES el HUD (directiva §4.4). La home se cubre en home-authed. */}
      <BottomHUDServer />
      <Grain />
    </>
  );
}
