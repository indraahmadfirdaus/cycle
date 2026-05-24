import { redirect } from "next/navigation";
import CycleApp from "@/components/cycle-app";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedHomePage() {
  if (!hasSupabaseEnv()) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return <CycleApp />;
}
