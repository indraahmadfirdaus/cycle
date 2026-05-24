import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedSupabase() {
  if (!hasSupabaseEnv()) {
    return {
      error: NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 503 })
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Authentication required." }, { status: 401 })
    };
  }

  return { supabase, user };
}
