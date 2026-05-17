import { createClient } from "@/lib/supabase/server";
import Landing from "./_components/landing";
import HomeAuthed from "./_components/home-authed";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? <HomeAuthed /> : <Landing />;
}
