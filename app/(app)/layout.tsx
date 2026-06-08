import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Grain from "@/app/_components/Grain";

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
      <Grain />
    </>
  );
}
